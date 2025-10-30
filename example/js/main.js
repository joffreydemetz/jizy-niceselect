(function () {

    console.log('NiceSelect example page');

    document.querySelectorAll('select').forEach(el => {
        new NiceSelect(el);
    });
})();
