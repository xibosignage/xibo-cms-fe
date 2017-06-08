<?php
namespace Xibo\Custom;

use Xibo\Controller\Base;
use Xibo\Service\ConfigServiceInterface;
use Xibo\Service\DateServiceInterface;
use Xibo\Service\LogServiceInterface;
use Xibo\Service\SanitizerServiceInterface;

/**
 * Class MyController
 * @package Xibo\Custom
 */
class LiveEditorController extends Base
{
    /**
     * Set common dependencies.
     * @param LogServiceInterface $log
     * @param SanitizerServiceInterface $sanitizerService
     * @param \Xibo\Helper\ApplicationState $state
     * @param \Xibo\Entity\User $user
     * @param \Xibo\Service\HelpServiceInterface $help
     * @param DateServiceInterface $date
     * @param ConfigServiceInterface $config
     */
    public function __construct($log, $sanitizerService, $state, $user, $help, $date, $config)
    {
        $this->setCommonDependencies($log, $sanitizerService, $state, $user, $help, $date, $config);
    }

    /**
     * Display Page for Test View
     */
    public function MainView()
    {
        // Set up any JavaScript translations
	// Call to render the template
        // This assumes that "twig-template-name-without-extension.twig" exists
        // in the active theme (i.e. in the view path of the active theme).
        $this->getState()->template = 'liveeditor';
        $this->getState()->setData([]); /* Data array to provide to the template */
    }
}
