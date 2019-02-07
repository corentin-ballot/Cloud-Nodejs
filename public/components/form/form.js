/* Form */

(function () {
    document.addEventListener('DOMContentLoaded', function () {
        Array.prototype.forEach.call(document.querySelectorAll('.input-text'), function (input) {
            input.addEventListener("change", adjustStyling, false);
            input.addEventListener("keyup", adjustStyling, false);
            input.addEventListener("focus", adjustStyling, true);
            input.addEventListener("blur", adjustStyling, true);
            input.addEventListener("mousedown", adjustStyling, false);
        });
    }, false);

    function adjustStyling(event) {
        let input = event.target;
        input.setAttribute('data-empty', input.value !== '' ? false : true);

        if (event.type === 'focus') {
            event.target.closest(".input-text").classList.add('focus');
        } else if (event.type === 'blur') {
            event.target.closest(".input-text").classList.remove('focus');
        }
    }
})();