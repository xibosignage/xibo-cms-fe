# Installation 
- Clone this repo
- Install and update your NPM repository with necessary packages (npm install)
- Run gulp to compile the project (it minimizes the JS/CSS for better performance, technically it's unnecessary)
- If you are a developer, edit Gulpfile.js to change your publishing location
- Run gulp publish to publish changes using rsync
- Or you can copy everything in build/ to the server manually
- The PHP files go in XiboRoot/custom (developers probably should symlink this for simplicity)
- The Twig files go in XiboRoot/views 
- The rest stays where it is
- In XiboRoot/web/settings.php add $middleware = [new \Xibo\Custom\LiveEditor()]; at the end of the file
- It "should" work when you go to your browser and enter www.yourxibohost.com/liveeditor
- Create your custom themes and/or Xibo to link to the page

# TODO:
There are lots of TODO's marked in the comments.
Other TODO's are better integration (automatic module installation) with the Xibo framework
This needs testing, it's alpha phase at best and it may eat your layouts (although it shouldn't)
This also needs optimization in various ways, there are some ugly constructions in there
UX designers should consider adding smoothing and light animation effects.
Please consider contributing to this project and the parent Xibo project