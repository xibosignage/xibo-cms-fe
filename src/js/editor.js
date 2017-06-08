var findLayout = function(currentValue, index, arr) {
    return currentValue.layoutId == this;
};

var widget_width_s = 10; //How wide is each widget (per second).
var widget_min_s = 5; //Minimum seconds 

var roundUpToMultiple = function (numToRound, multiple)
{
    if (multiple == 0) {
        return numToRound
    }

    var remainder = numToRound % multiple;
    if (remainder == 0)
        return numToRound;

    return numToRound + multiple - remainder;
}

var secondsToHms = function(secs) {
    var i = parseInt(secs);
    var d = Math.floor(i / 86400); //Get days
    var h = Math.floor(i % 86400 / 3600); //Get the remnant of 1 day, divided by 3600 = number of hours in the remnant
    var m = Math.floor(i % 86400 % 3600 / 60); //Remnant of 1 day, remnant of hours, divided by 60 
    var s = Math.floor(i % 86400 % 3600 % 60); //Remnant of 1 day, remnant of hours, remnant of minutes

    //If there are days, add days
    return (d ? (d + "d ") : "") + ("00" + h).slice(-2) + ":" + ("00" + m).slice(-2) + ":" + ("00" + s).slice(-2);
}



//This creates/updates the widget on the timeline based on data
var createTimelineWidget = function (widget) {
    console.log("Creating widget " + widget.widgetId + " on " + widget.playlistId);

    var new_widget = $("#timeline-playlist-" + widget.playlistId + "-widget-" + widget.widgetId);
    var playlist = $("#timeline-playlist-" + widget.playlistId);
    var widget_template = playlist.find(".widget.template");
    var parent = widget_template.parent();
    if (new_widget.length > 0) {
        //Widget already exists.
    } else {
        var new_widget = widget_template.clone();
        new_widget.prop("id", "timeline-playlist-" + widget.playlistId + "-widget-" + widget.widgetId);
        new_widget.removeClass("template");
        new_widget.find(".badge").text(widget.duration).on("click", function (e) {
            e.stopPropagation();
            $(this).hide();
            $(this).parent().find("input").show().focus().select();
        });
        new_widget.find("input").hide().val(widget.duration).on("focusout", function () {
            var value = parseInt($(this).val());
            if (value < widget_min_s) {
                $(this).addClass("alert-danger");
                return false;
            }
            $(this).removeClass("alert-danger");
            updateWidget({widgetId: widget.widgetId, duration: value});
            $(this).hide().parent().find(".badge").show();
        });
        parent.append(new_widget);
        new_widget.resizable({
            grid: [widget_width_s],
            containment: parent,
            handles: { 'e': new_widget.find(".mod-duration-handle") },
            minWidth: widget_width_s * widget_min_s
        });
        new_widget.on("resize", function (e, ui) {
            console.log("Resizing");
            ui.size.height = ui.originalSize.height; //Constrain height
            var width = roundUpToMultiple (ui.size.width, widget_width_s);
            var duration = width / widget_width_s;

            //Temporarily set the badge and input data
            $(this).find(".badge").text(duration);
            $(this).find("input").val(duration);
        });
        new_widget.on("resizestop", function (e, ui) {
            var width = roundUpToMultiple (ui.size.width, widget_width_s);
            ui.element.css({
                //Prevent weird interactions, such as moving the thing off the bar
                "left": 0, "width": width
            });
            var duration = width / widget_width_s;
            updateWidget({widgetId: widget.widgetId, duration: duration, useDuration: true});
        });
        new_widget.on("click", function () {
            //This emulates Xibo but ideally we'll replace this with a custom renderer of our own.  
            console.log("Loading widget preview");
            console.log(widget);

            //seq=1&width=104&height=104&scale_override=0.41666666666667&
            var seq = widget.displayOrder;
            //Get width and height of preview
            var region = findWidgetRegion(widget.widgetId);
            var wp = $("#widget-preview");
            var tb = wp.closest(".toolbox");
            tb.data(widget);
            var scale = wp.width() / region.width;
            var sw = region.width * scale;
            var sh = region.height  * scale;
            wp.height(sh);

            if (region) {
                $.getJSON("/region/preview/" + region.regionId, {seq: seq, width: sw, height: sh, scale_override: scale}).success(function (resp) {
                    wp.html(resp.html);
                });
            }
        });

        new_widget.on("dblclick", function () {
            return XiboFormRender("/playlist/widget/form/edit/" + widget.widgetId); 
        });
    }

    new_widget.addClass("widget-" + widget.type);
    new_widget.data(widget);
    console.log(widget);

    //If useDuration && duration is set, use duration, otherwise use calculatedDuration
    var duration = (parseInt(widget.useDuration) && parseInt(widget.duration)) ? parseInt(widget.duration) : parseInt(widget.calculatedDuration);

    //In most cases we could've passed the Region but we may just receive the updated widget from API
    var region = findWidgetRegion(widget.widgetId);

    //If region.loop is set or there are other widgets on the region width is always duration
    if (region.loop || region.playlists[0].widgets.length != 1) {
        new_widget.width(widget_width_s * duration);
    } else {
        //If region.loop is not set, width is infinite if this is the only widget
        new_widget.width(widget_width_s * Layout.duration);
    }

    new_widget.find(".widget-duration .badge").text(duration);
    new_widget.find(".widget-duration input").val(duration);

    new_widget.find(".widget-type").text(widget.type).prop("title", widget.type);
    new_widget.find(".widget-name").text(widget.name).prop("title", widget.name);
}

var loadWidgets = function (widgets, playlistId) {
    console.log("Loading widgets for " + playlistId);
    console.log(widgets);

    $.each (widgets, function (i, widget) {
        /*
            audio: Array (0)
            calculatedDuration: "10"
            displayOrder: "18"
            duration: 10
            isNew: false
            mediaIds: ["262"] (1)
            ownerId: 1
            permissions: [Object] (1) 
            playlistId: 57
            tempId: null
            type: "image"
            useDuration: "0"
            widgetId: 88
            widgetOptions: [] (0)
        */
        createTimelineWidget(widget);
    });
};

function URLToArray(url) {
    var request = [];
    var pairs = url.substring(url.indexOf('?') + 1).split('&');
    for (var i = 0; i < pairs.length; i++) {
        if(!pairs[i])
            continue;
        var pair = pairs[i].split('=');
        request[i] = {};
        request[i][decodeURIComponent(pair[0])] = decodeURIComponent(pair[1]);
    }
    return request;
}

$.fn.insertAt = function(index, $parent) {
    return this.each(function() {
        if (index === 0) {
            $parent.prepend(this);
        } else {
            $parent.children().eq(index - 1).after(this);
        }
    });
}

var createTimelinePlaylist = function (playlist, regionId) {
    var new_playlist = $("#timeline-playlist-" + playlist.playlistId);
    //We need to add this playlist to a particular region
    //First find the region
    var region = $("#timeline-region-" + regionId);
    //Each region has a template in the exact location playlists should be represented
    //This allows designers to create different UI without modifying (much) code
    var pl_template = region.find(".playlist.template");
    var parent = pl_template.parent();

    //As far as I am aware, the same playlist ID cannot be on multiple regions.
    //When that becomes possible, it should be sufficient to simply add regionId in the "id" 
    if (new_playlist.length) {
        console.log("Playlist already exists");
    } else {
        console.log("Creating Playlist for Region " + regionId);
        new_playlist = pl_template.clone();
        new_playlist.prop("id", "timeline-playlist-" + playlist.playlistId);
        new_playlist.removeClass("template"); //Remove the template class
        new_playlist.sortable({
            containment: "parent",
            tolerance: "pointer",
            opacity: 0.5,
            receive: function( event, ui ) {
                var type = ui.item.data("widget-type");
                var id = ui.item.prop("id");
                //Since we dragged a clone, ui.item actually points to the 'source' widget
                //We need to find the widget-source in the playlist to know where we inserted it
                var new_obj = $("#timeline .playlist .widget-source");
                var idx = new_obj.index();
                var arr = $(this).sortable('toArray');
                new_obj.remove(); //We don't need the widget clone anymore, we just needed it for it's index

                console.log("Item received: " + type + " displayOrder: " + idx);
                if (type == "library") {
                    var xhr = XiboFormRender("/playlist/form/library/assign/" + playlist.playlistId);
                } else if (type == "image" || type == "video") {
                    var validExt = ui.item.data("valid-extensions");
                    libraryUpload(playlist.playlistId, validExt);
                    $(document).on("ajaxSuccess.upload", function( event, xhr, settings ) {
                        if ( settings.type == "POST" && settings.url == "/library") { 
                            /*
                                {"files":[{"name":"EV Circuits Logo.png","size":5675,"type":"image\/png","url":"\/library?file=EV%20Circuits%20Logo.png&download=1","mediaId":461,"storedas":"461.png","duration":10,"retired":0,"fileSize":5675,"md5":"4e75d828cc825aa9e1344212935d6816","delete_url":"\/library?file=EV%20Circuits%20Logo.png","delete_type":"DELETE"}]}
                            */
                            var files = xhr.responseJSON.files;
                            var data  = {media: []};
                            files.forEach(function (f, i) {
                                data.media.push(f.mediaId); 
                            });
                            var w = $.post("/playlist/library/assign/" + playlist.playlistId, data);
                            w.success(function () {
                                loadLayout(Layout.layoutId)
                            });
                        }
                    });
                }

                //We intercept and handle the actual assign
                $(document).off('ajaxSuccess.assign').on("ajaxSuccess.assign", function( event, xhr, settings ) {
                    //This is a bit of a Xibo ideosyncracy. Widgets are always added to the end of the playlist when using this form
                    if ( settings.type == "POST" && settings.url == "/playlist/library/assign/" + playlist.playlistId) {
                        //An item has been assigned from the library
                        var newPlaylist = xhr.responseJSON.data;
                        var post = {};
                        //Widgets are returned in order of display
                        newPlaylist.widgets.forEach(function (e, i) {
                            //1 - 5 | 4, 5 is new should be in place 2, 3
                            //i = 1 - 3 e.isNew doesn't trigger
                            //i = 0, idx = 2, Result = 1
                            //i = 1, idx = 2, Result = 4 
                            //i = 2, idx = 2, Result = 5
                            //i = 3, idx = 2, Result = 2
                            //i = 4, idx = 3, Result = 3
                            if (e.isNew) {
                                post["widgets["+e.widgetId+"]"] = idx;
                                idx++;
                            } else {
                                if (i < idx - 1) {
                                    post["widgets["+e.widgetId+"]"] = e.displayOrder;
                                } else if (i >= idx - 1) {
                                    post["widgets["+e.widgetId+"]"] = e.displayOrder + newWidgets.length;
                                }
                            }

                        });
                        $.post("/playlist/order/" + playlist.playlistId, post).success(function () { 
                            loadLayout(Layout.layoutId); 
                            //TODO: only make a request to GET the /playlist/id and then call loadPlaylists
                        });
                    } else {
                        event.stopPropagation(); //This should prevent the "off" to be called
                        return false
                    }
                });

            },
            update: function(event, ui) {        
                var arr = $(this).sortable('toArray').filter(function(e) {
                    return (e != "");               
                });
                var post = {};
                arr.forEach(function(e, i) {
                    var rid = $("#"+e).data("widgetId");
                    post["widgets["+rid+"]"] = i + 1;
                });
                $.post("/playlist/order/" + playlist.playlistId, post);
                //TODO: Handle the reordered widgets 
                /* 
                POST: /playlist/order/57
                Name	Value
                widgets[ID] - order #
                widgets[77]	4
                widgets[78]	5
                widgets[79]	6
                widgets[81]	10
                widgets[82]	7
                widgets[83]	8
                widgets[84]	9  
                widgets[85]	11
                widgets[86]	12
                widgets[87]	13
                widgets[90]	1
                widgets[91]	3
                widgets[93]	2
                widgets[166]	14
                */
                /* TODO: adding a widget 
                GET /playlist/widget/form/add/<type>/57
                -wait for-
                POST /playlist/widget/<type>/<playlistId>
                returns Object {"id": 170, data: {widget_data}}
                -then-
                Reorder
                */
            }
        }); //End of sortable
        parent.append(new_playlist);
    }

    //Each playlist has these properties
    //displayOrder: "1"
    //name: "Sapori Demo-4"
    //ownerId: 1
    //permissions: [Object] (1)
    //playlistId: 58
    //tags: [] (0)
    //widgets: [Object] (1)

    //We need to append to the parent of the template. We do it first so we can calculate the width.
    //We append at the "displayOrder" index (index 0 is the template)
    //parent.insertAt(playlist.displayOrder, new_playlist);
    new_playlist.width(Layout.duration * widget_width_s * 2);

    //Now we add it's Widgets to the Playlist - we need to test to make sure widgets has been returned. 
    //If not, we're most likely updating this after an API call and all the widgets still exist and haven't changed
    //Currently API always seems to return widgets, but it's technically not necessary
    if (playlist.widgets) {
        loadWidgets(playlist.widgets, playlist.playlistId);
    }
}

var loadPlaylists = function (playlists, regionId) {
    //Currently it seems only 1 playlist per region but the structure implies more are possible
    $.each(playlists, function (idx, playlist) {
        console.log("Creating playlist #" + idx + " ID:"+ playlist.playlistId);
        createTimelinePlaylist(playlist, regionId);
        //TODO: Create playlists in previews, toolboxes etc.
    });

    //After all the playlists are created, we connect the "new widget toolbar" to all the playlists that are sortable
    $(".widget-source").draggable("option", "connectToSortable", ".playlist.ui-sortable");
};

var activateRegion = function (regionId) {
    var lr = $("#layout-region-" + regionId);
    var region = findRegion(regionId);
    var wp = $("#widget-preview");

    //Reset the region active classes
    $(".region.active").removeClass("active");
    lr.addClass("active");
    $("#timeline-region-" + regionId).addClass("active");

    //Remove all old content from the preview
    wp.find("*").remove();
    //Set the background on the preview
    wp.css("background", lr.css("background"));
    //Check if this layout has a background image. If it does, then we need to set the Layout background + Region's offset.
    if (Layout.backgroundImageId) {
        var scale = wp.width() / region.width;
        //Scale the image to proportion
        wp.css("background-image", "url('/library/download/" + Layout.backgroundImageId + "?preview=1&width="+Layout.width * scale +"&height="+Layout.height * scale+"')");
        //Background-position indicates where in the 'view window' to start drawing the background, not relative to the background image.
        //in our case this will be somewhere off-screen, hence the negative values.
        wp.css("background-position", region.left * scale * -1 + "px " + region.top * scale * -1 + "px");
    }
};

//Helper function to find the Region data based on region ID
var findRegion = function (regionId) {
    return Layout.regions.find(function (r) {
        return r.regionId == regionId;
    });
}

//Helper function to find the Widget data based on widget ID
var findWidget = function (widgetId) {
    for (var i = 0; i < Layout.regions.length; i++) {
        var playlists = Layout.regions[i].playlists;
        for (var j = 0; j < playlists.length; j++) {
            var widgets = playlists[j].widgets.find(function (w) {
                return w.widgetId == widgetId;
            });
            if (widgets) {
                return widgets;
            }
        }
    }
}

//Helper function to find which Region this Widget is in
//This is faster and more accurate than trying to search the DOM
var findWidgetRegion = function (widgetId) {
    for (var i = 0; i < Layout.regions.length; i++) {
        var playlists = Layout.regions[i].playlists;
        for (var j = 0; j < playlists.length; j++) {
            var widgets = playlists[j].widgets.find(function (w) {
                return w.widgetId == widgetId;
            });
            if (widgets) {
                return Layout.regions[i];
            }
        }
    } 
}

//Check if two arrays are equal
var arraysEqual = function (arr1, arr2) {
    if(arr1.length !== arr2.length)
        return false;
    for(var i = arr1.length; i--;) {
        if(arr1[i] !== arr2[i])
            return false;
    }
    return true;
}

//Check if there are any updates to be done to an object and do them
var updateObj = function (orig, updates) {
    //Handles arrays and deep objects
    var changes = 0;
    for (key in updates) {
        //Check for changes
        if (typeof orig[key] !== 'undefined') {
            if (Array.isArray(orig[key])) {
                if (!arraysEqual(orig[key], updates[key])) {
                    orig[key] = updates[key];
                    changes++;
                }
            } else if (typeof orig[key] === "object") {
                changes += updateObj(orig[key], updates[key]);
            } else if (orig[key] != updates[key]) {
                orig[key] = updates[key];
                changes++;
            }
        }
    }
    return changes;
}

//Update a Widget with new data, if there is new data, send it to the server
var updateWidget = function (dataObj) {
    var widget = findWidget(dataObj.widgetId);
    if (widget) {
        dataObj.loop = 1; //For purposes of this application, widgets should probably loop?
        dataObj.useDuration = 1; //And we use duration too
        dataObj.playlistId = widget.playlistId;
        var changes = updateObj(widget, dataObj);
        if (changes) {
            //Certain widgets require some data to be passed again at every change
            if (widget.widgetOptions.length > 0) {
                for (var i = 0; i < widget.widgetOptions.length; i++) {
                    if (widget.widgetOptions[i].type == "attrib") {
                        if (typeof dataObj[widget.widgetOptions[i].option] === "undefined") {
                            if (widget.widgetOptions[i].option == "uri") { //URI's are given to us encoded but Xibo doesn't understand them
                                dataObj[widget.widgetOptions[i].option] = decodeURI(widget.widgetOptions[i].value);
                            } else {
                                dataObj[widget.widgetOptions[i].option] = widget.widgetOptions[i].value;
                            }

                        }
                    }
                }
            }
            console.log("Widget Update API Call");
            console.log(widget);
            $.ajax({
                method: "PUT",
                url: "/playlist/widget/" + dataObj.widgetId,
                data: dataObj 
            }).done(function( r ) {
                if (!r.success) {
                    alert ("ERROR: " + r.message);
                    return;
                }
                console.log( "Widget Update API Return: ");
                console.log(r);

                //Update the object with returned data
                updateObj(widget, r.data);
                //This should just update the UI because we just called updateObj()
                updateWidget(widget);
            }).fail(function (jqXHR, textStatus, e) {
                //TODO: Handle errors better
                alert ( "ERROR: " + jqXHR.responseText + " " + e);
            });
        }

        //Find all region instances in this view
        //createTimelineWidget(widget) updates the view
        createTimelineWidget(widget);
    } else {
        //TODO: Make this an error?
        console.log("ERROR: Called updateWidget without valid widgetId");
    }
}

var updateRegion = function (dataObj) {
    var region = findRegion(dataObj.regionId);
    if (region) {
        var changes = updateObj(region, dataObj);
        //For purposes of this application, regions should not loop, media items should
        dataObj.loop = 0; 
        //For some reason region dimensions always have to be given - region variable is updated by now
        dataObj.height = region.height;
        dataObj.width = region.width;
        dataObj.top = region.top;
        dataObj.left = region.left;
        if (changes) {
            console.log("Region Update API Call - Changes " + changes);
            $.ajax({
                method: "PUT",
                url: "/region/" + dataObj.regionId,
                data: dataObj
            }).done(function( r ) {
                if (!r.success) {
                    alert ("ERROR: " + r.message);
                }
                console.log( "Region Update API Returns: ");
                console.log(r);
                updateObj(region, r);
                //TODO: Handle returned data?
            }).fail(function (jqXHR, textStatus, e) {
                //TODO: Handle errors better
                alert ( "ERROR: " + jqXHR.responseText + " " + e);
            });
        }

        //Find all region instances in this view
        $(".region").each(function (i, el) {
            if ($(this).data("regionId") == dataObj.regionId) {
                var jqObj = $(this);
                for (key in dataObj) {
                    jqObj.data(key, dataObj[key]);
                }
                var uiObj = jqObj.data();
                var w = Math.round(uiObj.width);
                var h = Math.round(uiObj.height);
                var t = Math.round(uiObj.top);
                var l = Math.round(uiObj.left);
                jqObj.find(".region-dimensions").html("Dim: " + w + "x" + h + "<br>" + "Pos: " + t + "x" + l);
                if (jqObj.closest(".toolbox").length != 0) {
                    //If this is in a toolbox
                    jqObj.css({
                        width: Math.round(uiObj.width * uiObj.scale_w),
                        height: Math.round(uiObj.height * uiObj.scale_h),
                        top: Math.round(uiObj.top * uiObj.scale_h),
                        left: Math.round(uiObj.left * uiObj.scale_w),
                        zIndex: uiObj.zIndex
                    });
                    jqObj.prop("title", uiObj.name);
                }
            }
        });
    } else {
        //TODO: Make this an error?
        console.log("ERROR: Called updateRegion without regionId");
    }
};


var createTimelineRegion = function (idx, region) {
    var tl_template = $("#timeline .region.template");
    var parent = tl_template.parent();
    var tl_region = tl_template.clone();

    tl_region.prop("id", "timeline-region-" + region.regionId);
    tl_region.data({
        "regionId": region.regionId,
        "layoutId": region.layoutId,
        "ownerId": region.ownerId,
        "name": region.name,
        "width": region.width,
        "height": region.height,
        "top": region.top,
        "left": region.left,
        "zIndex": region.zIndex,
        "displayOrder": region.displayOrder,
        "duration": region.duration,
        "tempId": region.tempId
    });

    var reg_name = tl_region.find(".region-name");
    reg_name.prop("title", region.name);
    reg_name.text("Region " + String.fromCharCode(65 + idx));
    tl_region.on("click", function () {
        activateRegion(region.regionId); 
    });
    tl_region.removeClass("template");

    //Append this object to the timeline
    parent.append(tl_region);
    parent.sortable('refresh');

    //Load playlists onto the timeline
    loadPlaylists(region.playlists, region.regionId);

    if (region.duration && region.duration < Layout.duration && countRegionWidgets(region) > 1) {
        var playlist = tl_region.find(".playlist").last();
        var children = playlist.children();
        var repeat = Math.ceil(Layout.duration / region.duration) - 1;
        console.log("Repeating this playlist " + repeat)
        for (var i = 0; i < repeat; i++) {
            children.clone(true, true).appendTo(playlist);
        }
    } 
}

//Count the number of Widgets in this region, more accurate and faster than using DOM
var countRegionWidgets = function (region) {
    var cntWidget = 0;
    if (region.playlists && region.playlists.length) {
        for (var i = 0; i < region.playlists.length; i++) {
            if (region.playlists[i].widgets) {
                cntWidget += region.playlists[i].widgets.length;
            }
        }
    }
    return cntWidget;
}

//loadRegions loads the regions in the HTML
//arg layout: a regions object from layout
var loadRegions = function () {
    /*  {
                    "regionId": 60,
                    "layoutId": 75,
                    "ownerId": 1,
                    "name": "Demo-1",
                    "width": "252.0000",
                    "height": "736.8000",
                    "top": "0.0000",
                    "left": "275.5800",
                    "zIndex": 0,
                    "playlists": [],
                    "regionOptions": [],
                    "permissions": [],
                    "displayOrder": null,
                    "duration": "0",
                    "tempId": null
                },*/

    //Sort regions by zIndex - higher zIndex go on top for purposes of this application
    Layout.regions.sort(function(a, b) {
        if (a.zIndex > b.zIndex) 
            return -1; 
        if (a.zIndex < b.zIndex)
            return 1; 
        return 0; 
    });

    var preview = $("#preview");

    //Place it on the timeline
    $.each(Layout.regions, function (i, region) {
        createTimelineRegion (i, region);
    });

    //Load the regions on the toolboxes
    $.each(Layout.regions, function (i, region) {
        var lt = $(".toolbox.toolbox-layout");
        var wp = $("#widget-preview");

        //Render it in the preview and layouts
        var tb_regions = lt.find(".regions");
        var tb_template = lt.find(".regions .region.template");
        var tb_region = tb_template.clone();

        //Calculate scaling
        var lw = Layout.width;
        var lh = Layout.height;
        var fw = tb_regions.width(); 
        var fh = fw * (lh / lw); //Make the preview proportional to layout
        tb_regions.height(fh); //Set the preview height to calculated height

        wp.width(fw).height(fh); //Set the widget preview height to the calculated height

        var scale_h = fh / lh; //Calculate scale factor for both width and height
        var scale_w = fw / lw;

        tb_regions.css("background", Layout.backgroundColor);
        if (Layout.backgroundImageId) {
            tb_regions.css("background-image", "url('/library/download/" + Layout.backgroundImageId + "?preview=1&width="+fw+"&height="+fh+"')");
        }

        tb_region.prop("id", "layout-region-" + region.regionId);
        tb_region.on("click", function () {
            activateRegion(region.regionId); 
        });

        region.scale_h = scale_h;
        region.scale_w = scale_w;

        tb_region.data(region);

        tb_region.find(".region-letter").text(String.fromCharCode(65 + i));

        tb_regions.append(tb_region);
        tb_region.removeClass("template");

        var resizeFn = function (event, ui) {
            //When stop resizing, we need to update top, left, width and height
            var t = ui.position.top / scale_h;
            var l = ui.position.left / scale_w;
            if (ui.size) {
                var w = ui.size.width / scale_w;
                var h = ui.size.height / scale_h;
            } else {
                var w = region.width;
                var h = region.height;
            }
            return updateRegion({regionId: region.regionId, top: t, left: l, width: w, height: h});
        }

        tb_region.draggable({
            containment: "parent",
            stop: resizeFn
        });

        tb_region.resizable({
            containment: "parent",
            stop: resizeFn
        });

        //Do all the update region calls without calling the API
        updateRegion(region);

        //Now we can calculate the background for the playlist
        $("#timeline-region-" + region.regionId).css("background", tb_region.css("background"));
    });


};

var clearLayout = function () {
    //Clear playlist
    $(".region:not(.template)").remove();
}

var Layout = {};

var loadLayout = function (layoutId) {
    //TODO: Make sure everything is saved before we change layouts?

    $.getJSON("/layout", {layoutId: layoutId, embed: "regions,playlists,tags,permissions,widgets"}).success(function (layouts) {
        Layout = layouts.data[0];
        $("[data-layout-name]").html($("<span>").text(Layout.layout));
        clearLayout();
        $("#playlist-scrollbar").width(Layout.duration * widget_width_s); //Make it 25% larger so we can add things to it.
        $("#layout-time").text(secondsToHms(Layout.duration));
        loadRegions(Layout);

    }).error(function () {
        //TODO: Better error handling
        alert("An error happened loading your layout");
    });
};

var showDimensions = function () {
    $(".region").find(".region-dimensions").toggle();
}

var lockRegions = function (o) {
    if ($(o).hasClass("active")) {
        $("#timeline").sortable('enable');
        $(".region.ui-draggable").draggable('enable');
        $(".region.ui-resizable").resizable('enable');
    } else {
        $("#timeline").sortable('disable');
        $(".region.ui-draggable").draggable('disable');
        $(".region.ui-resizable").resizable('disable');
    }
}

var findButton = function (btn_name) {
    return Layout.buttons.find(function (btn) {
        return btn.id == btn_name;  
    });
};

var regionEdit = function (o) {
    var region = $(o).closest(".region").data();
    //XiboFormRender has a similar syntax to getJSON but it doesn't return any useful objects
    return XiboFormRender("/region/form/edit/" + region.regionId);
}

var regionDelete = function (o) {
    var region = $(o).closest(".region").data();
    //XiboFormRender has a similar syntax to getJSON but it doesn't return any useful objects
    return XiboFormRender("/region/form/delete/" + region.regionId);
}

var regionPermissions = function (o) {
    var region = $(o).closest(".region").data();
    return XiboFormRender("/user/permissions/form/Region/" + region.regionId);
}

var saveAsTemplate = function (o) {
    return XiboFormRender("/template/form/layout/" + Layout.layoutId);
}

var deleteWidget = function (o) {
    var widgetId = $(o).closest(".widget").data("widgetId");
    return XiboFormRender("/playlist/widget/form/delete/" + widgetId);
}

var permissionsWidget = function (o) {
    var widgetId = $(o).closest(".widget").data("widgetId");
    return XiboFormRender("/user/permissions/form/Widget/" + widgetId);
}

var layoutAddRegion = function (o) {
    return $.ajax({
        method: "POST",
        url: "/region/" + Layout.layoutId
    }).done(function( r ) {
        if (!r.success) {
            alert ("ERROR: " + r.message);
            return;
        }
        console.log( "Region Add API Return: ");
        console.log(r);

        //Reload the layout, redraw everything
        loadLayout(Layout.layoutId);
    }).fail(function (jqXHR, textStatus, e) {
        //TODO: Handle errors better
        alert ( "ERROR: " + jqXHR.responseText + " " + e);
    });
}

var layoutAction = function (o, id) {
    var btn = findButton(id);
    return XiboFormRender(btn.url);
}

//Listen for all sorts of requests that XiboFormRender does and that are relevant to our operation but we can't attach a handler to.
$(document).ajaxSuccess(function( event, xhr, settings ) {
    console.log("XHR Call")
    console.log(settings);
    console.log(xhr);
    console.log(event);
    //Delete things usually have a confirmation form.
    if ( settings.type == "DELETE") {
        //Reload the entire layout - this is relatively quick
        loadLayout(Layout.layoutId);   
    } else if ( settings.type == "PUT" && settings.url == "/layout/" + Layout.layoutId) {
        loadLayout(Layout.layoutId);
    }

});

var previewTimeline = function (o) {
    var popupTemplate = $(
        '<div class="modal fade">' +
        '  <div class="modal-dialog">' +
        '    <div class="modal-content">' +
        '      <div class="modal-header">' +
        '        <button type="button" class="close" data-dismiss="modal">&times;</button>' +
        '        <h4 class="modal-title">Preview</h4>' +
        '      </div>' +
        '      <div class="modal-body">' + 
        //Scrolling = no is technically not proper HTML5 but everybody understands it, Safari doesn't seem to care about "overflow: hidden;"
        '       <iframe id="layout-preview" style="overflow: hidden;" scrolling="no"></iframe>' +
        '      </div>' +
        '      <div class="modal-footer">' +
        '        <button type="button" class="btn btn-link" data-dismiss="modal">Quit</button>' +
        '      </div>' +
        '    </div>' +
        '  </div>' +
        '</div>');

    var modal = popupTemplate.modal();

    //When the modal shows, we need to resize everything according to it's size. For some reason the iframe needs a fixed size.
    modal.on('shown.bs.modal', function (e) {
        var body = modal.find(".modal-body");
        var iframe = $("#layout-preview");
        body.height(body.width() * (Layout.height / Layout.width));
        iframe.width(body.width());
        iframe.height(body.height());
        iframe.attr("src", "/layout/preview/" + Layout.layoutId);
    });

    //When the modal hides, we need to destroy it so the iframe stops "playing".
    modal.on('hidden.bs.modal', function (e) {
        $(this).data('modal', null);
        modal.remove();
    });
}

var fill_select_layout = function () {
    $.getJSON("/layout?length=500")
        .success(function (layouts) {
        var select_tag = $("#select-layout");
        $.each(layouts.data, function (i, layout) {
            select_tag.append($("<option>", {value: layout.layoutId, text: layout.layout}));
        });
        select_tag.on("change", function () {
            var layoutId = this.value;
            loadLayout(layoutId);
        });
    })
        .error(function () {
        alert("An error happened connecting to the API");
    });

};

var playlistScrollFn = function (e) {
    var tl = $('#timeline .playlist-body, #scrollbar .playlist-scroller-body').scrollLeft(e.target.scrollLeft);
}

var setup = function () {
    $("#header-content").appendTo(".row.header .col-sm-12");
    $(".widget-source").draggable({
        containment: "#timeline-section",
        helper: "clone",
        revert: "invalid"
    });
    $("#timeline").sortable({ 
        opacity: 0.5, 
        containment: "parent",
        start: function( event, ui ) {
            console.log("Sorting started on Timeline");
        },
        update: function(event, ui) {        
            var arr = $(this).sortable('toArray').filter(function(e) {
                console.log(e);
                return (e != "");              
            });
            console.log(arr);
            arr.forEach(function(e, i) {
                var rid = $("#"+e).data("regionId");
                //We reordered, this modifies the zIndex
                //For purposes of this application, zIndex is governed by the order of the region in the list.
                //However Xibo native does not have this mechanism.
                var zidx = arr.length - i;
                updateRegion({regionId: rid, zIndex: zidx});
            });      
        } 
    });
    $("#scrollbar .playlist-scroller-body").on("scroll", playlistScrollFn);
    $("#timeline").on("scroll", ".playlist-body", playlistScrollFn);
    fill_select_layout();   
}();


