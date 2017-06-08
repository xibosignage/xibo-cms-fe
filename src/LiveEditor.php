<?php
namespace Xibo\Custom;

use Slim\Middleware;

/**
 * Class LiveEditor
 * @package Xibo\custom
 *
 * Included by instantiation in `settings.php`
 */
class LiveEditor extends Middleware
{
    public function call()
    {
        $app = $this->getApplication();

        // Register some new routes
        $app->get('/liveeditor', '\Xibo\Custom\LiveEditorController:MainView')->setName('LiveEditor');

        // Register a new controller with DI
        // This Controller uses the CMS standard set of dependencies. Your controller can
        // use any dependencies it requires.
        // If you want to inject Factory objects, be wary of circular references.
        $app->container->singleton('\Xibo\Custom\LiveEditorController', function($container) {
            return new \Xibo\Custom\LiveEditorController(
                $container->logService,
                $container->sanitizerService,
                $container->state,
                $container->user,
                $container->helpService,
                $container->dateService,
                $container->configService,
		$container->moduleFactory
		);
        });

        // Next middleware
        $this->next->call();
    }
}
