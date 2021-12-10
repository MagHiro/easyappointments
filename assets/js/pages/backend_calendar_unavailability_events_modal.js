/* ----------------------------------------------------------------------------
 * Easy!Appointments - Open Source Web Scheduler
 *
 * @package     EasyAppointments
 * @author      A.Tselegidis <alextselegidis@gmail.com>
 * @copyright   Copyright (c) 2013 - 2020, Alex Tselegidis
 * @license     http://opensource.org/licenses/GPL-3.0 - GPLv3
 * @link        http://easyappointments.org
 * @since       v1.2.0
 * ---------------------------------------------------------------------------- */

/**
 * Backend Calendar Unavailability Events Modal
 *
 * This module implements the unavailability events modal functionality.
 *
 * @module BackendCalendarUnavailabilityEventsModal
 */
window.BackendCalendarUnavailabilityEventsModal = window.BackendCalendarUnavailabilityEventsModal || {};

(function (exports) {
    'use strict';

    function bindEventHandlers() {
        /**
         * Event: Manage Unavailable Dialog Save Button "Click"
         *
         * Stores the unavailable period changes or inserts a new record.
         */
        $('#manage-unavailable #save-unavailable').on('click', function () {
            var $dialog = $('#manage-unavailable');
            $dialog.find('.modal-message').addClass('d-none');
            $dialog.find('.is-invalid').removeClass('is-invalid');

            var startMoment = moment($dialog.find('#unavailable-start').datetimepicker('getDate'));

            if (!startMoment.isValid()) {
                $dialog.find('#unavailable-start').addClass('is-invalid');

                return;
            }

            var endMoment = moment($dialog.find('#unavailable-end').datetimepicker('getDate'));

            if (!endMoment.isValid()) {
                $dialog.find('#unavailable-end').addClass('is-invalid');

                return;
            }

            if (startMoment.isAfter(endMoment)) {
                // Start time is after end time - display message to user.
                $dialog
                    .find('.modal-message')
                    .text(EALang.start_date_before_end_error)
                    .addClass('alert-danger')
                    .removeClass('d-none');

                $dialog.find('#unavailable-start, #unavailable-end').addClass('is-invalid');

                return;
            }

            // Unavailable period records go to the appointments table.
            var unavailable = {
                start_datetime: startMoment.format('YYYY-MM-DD HH:mm:ss'),
                end_datetime: endMoment.format('YYYY-MM-DD HH:mm:ss'),
                notes: $dialog.find('#unavailable-notes').val(),
                id_users_provider: $('#unavailable-provider').val()
            };

            if ($dialog.find('#unavailable-id').val() !== '') {
                // Set the id value, only if we are editing an appointment.
                unavailable.id = $dialog.find('#unavailable-id').val();
            }

            var successCallback = function () {
                // Display success message to the user.
                Backend.displayNotification(EALang.unavailable_saved);

                // Close the modal dialog and refresh the calendar appointments.
                $dialog.find('.alert').addClass('d-none');

                $dialog.modal('hide');

                $('#select-filter-item').trigger('change');
            };

            BackendCalendarApi.saveUnavailable(unavailable, successCallback, null);
        });

        /**
         * Event : Insert Unavailable Time Period Button "Click"
         *
         * When the user clicks this button a popup dialog appears and the use can set a time period where
         * he cannot accept any appointments.
         */
        $('#insert-unavailable').on('click', function () {
            BackendCalendarUnavailabilityEventsModal.resetUnavailableDialog();
            var $dialog = $('#manage-unavailable');

            // Set the default datetime values.
            var startMoment = moment();

            var currentMin = parseInt(startMoment.format('mm'));

            if (currentMin > 0 && currentMin < 15) {
                startMoment.set({minutes: 15});
            } else if (currentMin > 15 && currentMin < 30) {
                startMoment.set({minutes: 30});
            } else if (currentMin > 30 && currentMin < 45) {
                startMoment.set({minutes: 45});
            } else {
                startMoment.add(1, 'hour').set({minutes: 0});
            }

            if ($('.calendar-view').length === 0) {
                $dialog.find('#unavailable-provider').val($('#select-filter-item').val()).closest('.form-group').hide();
            }

            $dialog
                .find('#unavailable-start')
                .val(GeneralFunctions.formatDate(startMoment.toDate(), GlobalVariables.dateFormat, true));
            $dialog
                .find('#unavailable-end')
                .val(
                    GeneralFunctions.formatDate(startMoment.add(1, 'hour').toDate(), GlobalVariables.dateFormat, true)
                );
            $dialog.find('.modal-header h3').text(EALang.new_unavailable_title);
            $dialog.modal('show');
        });
    }

    /**
     * Reset unavailable dialog form.
     *
     * Reset the "#manage-unavailable" dialog. Use this method to bring the dialog to the initial state
     * before it becomes visible to the user.
     */
    exports.resetUnavailableDialog = function () {
        var $dialog = $('#manage-unavailable');

        $dialog.find('#unavailable-id').val('');

        // Set default time values
        var start = GeneralFunctions.formatDate(moment().toDate(), GlobalVariables.dateFormat, true);

        var end = GeneralFunctions.formatDate(moment().add(1, 'hour').toDate(), GlobalVariables.dateFormat, true);

        var dateFormat;

        switch (GlobalVariables.dateFormat) {
            case 'DMY':
                dateFormat = 'dd/mm/yy';
                break;
            case 'MDY':
                dateFormat = 'mm/dd/yy';
                break;
            case 'YMD':
                dateFormat = 'yy/mm/dd';
                break;
        }

        var fDay = GlobalVariables.firstWeekday;
        var fDaynum = GeneralFunctions.getWeekDayId(fDay);

        $dialog.find('#unavailable-start').datetimepicker({
            dateFormat: dateFormat,
            timeFormat: GlobalVariables.timeFormat === 'regular' ? 'h:mm tt' : 'HH:mm',

            // Translation
            dayNames: [
                EALang.sunday,
                EALang.monday,
                EALang.tuesday,
                EALang.wednesday,
                EALang.thursday,
                EALang.friday,
                EALang.saturday
            ],
            dayNamesShort: [
                EALang.sunday.substr(0, 3),
                EALang.monday.substr(0, 3),
                EALang.tuesday.substr(0, 3),
                EALang.wednesday.substr(0, 3),
                EALang.thursday.substr(0, 3),
                EALang.friday.substr(0, 3),
                EALang.saturday.substr(0, 3)
            ],
            dayNamesMin: [
                EALang.sunday.substr(0, 2),
                EALang.monday.substr(0, 2),
                EALang.tuesday.substr(0, 2),
                EALang.wednesday.substr(0, 2),
                EALang.thursday.substr(0, 2),
                EALang.friday.substr(0, 2),
                EALang.saturday.substr(0, 2)
            ],
            monthNames: [
                EALang.january,
                EALang.february,
                EALang.march,
                EALang.april,
                EALang.may,
                EALang.june,
                EALang.july,
                EALang.august,
                EALang.september,
                EALang.october,
                EALang.november,
                EALang.december
            ],
            prevText: EALang.previous,
            nextText: EALang.next,
            currentText: EALang.now,
            closeText: EALang.close,
            timeOnlyTitle: EALang.select_time,
            timeText: EALang.time,
            hourText: EALang.hour,
            minuteText: EALang.minutes,
            firstDay: fDaynum
        });
        $dialog.find('#unavailable-start').val(start);

        $dialog.find('#unavailable-end').datetimepicker({
            dateFormat: dateFormat,
            timeFormat: GlobalVariables.timeFormat === 'regular' ? 'h:mm tt' : 'HH:mm',

            // Translation
            dayNames: [
                EALang.sunday,
                EALang.monday,
                EALang.tuesday,
                EALang.wednesday,
                EALang.thursday,
                EALang.friday,
                EALang.saturday
            ],
            dayNamesShort: [
                EALang.sunday.substr(0, 3),
                EALang.monday.substr(0, 3),
                EALang.tuesday.substr(0, 3),
                EALang.wednesday.substr(0, 3),
                EALang.thursday.substr(0, 3),
                EALang.friday.substr(0, 3),
                EALang.saturday.substr(0, 3)
            ],
            dayNamesMin: [
                EALang.sunday.substr(0, 2),
                EALang.monday.substr(0, 2),
                EALang.tuesday.substr(0, 2),
                EALang.wednesday.substr(0, 2),
                EALang.thursday.substr(0, 2),
                EALang.friday.substr(0, 2),
                EALang.saturday.substr(0, 2)
            ],
            monthNames: [
                EALang.january,
                EALang.february,
                EALang.march,
                EALang.april,
                EALang.may,
                EALang.june,
                EALang.july,
                EALang.august,
                EALang.september,
                EALang.october,
                EALang.november,
                EALang.december
            ],
            prevText: EALang.previous,
            nextText: EALang.next,
            currentText: EALang.now,
            closeText: EALang.close,
            timeOnlyTitle: EALang.select_time,
            timeText: EALang.time,
            hourText: EALang.hour,
            minuteText: EALang.minutes,
            firstDay: fDaynum
        });
        $dialog.find('#unavailable-end').val(end);

        // Clear the unavailable notes field.
        $dialog.find('#unavailable-notes').val('');
    };

    exports.initialize = function () {
        var $unavailabilityProvider = $('#unavailable-provider');

        for (var index in GlobalVariables.availableProviders) {
            var provider = GlobalVariables.availableProviders[index];

            $unavailabilityProvider.append(new Option(provider.first_name + ' ' + provider.last_name, provider.id));
        }

        bindEventHandlers();
    };
})(window.BackendCalendarUnavailabilityEventsModal);