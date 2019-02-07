/* Tab-bar */

(function () {
    document.addEventListener('DOMContentLoaded', function () {
        Array.prototype.forEach.call(document.getElementsByClassName('tab-bar'), function (tabBar) {
            Array.prototype.forEach.call(tabBar.getElementsByClassName('tab-bar_tab'), function (tab) {
                tab.addEventListener('click', function (e) {
                    e.preventDefault();
                    // Reset selected tabs
                    Array.prototype.forEach.call(tabBar.getElementsByClassName('tab-bar_tab'), function (t) {
                        t.setAttribute('aria-expanded', false);
                        let p = document.getElementById(t.getAttribute('href').replace('#', ''));
                        p.setAttribute('aria-hidden', true);
                    });

                    // Select clicked tab
                    tab.setAttribute('aria-expanded', true);
                    let panel = document.getElementById(tab.getAttribute('href').replace('#', ''));
                    panel.setAttribute('aria-hidden', false);
                });
            });
        });
    }, false);
})();