import { jPackConfig } from 'jizy-packer';

const jPackData = function () {
    jPackConfig.sets({
        name: 'NiceSelect',
        alias: 'jizy-niceselect',
        defaults: {
            // add your custom default config here
        }
    });

    jPackConfig.set('onCheckConfig', () => { });
    jPackConfig.set('onGenerateBuildJs', (code) => code);
    jPackConfig.set('onGenerateWrappedJs', (wrapped) => wrapped);
    jPackConfig.set('onPacked', () => { });
};

export default jPackData;
