Ext.ns('Ext.ux');

/**
 * @class Ext.ux.TimePicker
 * @extends Ext.Picker
 *
 * <p>A time picker component which shows a TimePicker on the screen. This class extends from {@link Ext.Picker} and {@link Ext.Sheet} so it is a popup.</p>
 * <p>This component has no required properties.</p>
 *
 * <h2>Useful Properties</h2>
 * <ul class="list">
 *   <li>{@link #hourFrom}</li>
 *   <li>{@link #hourTo}</li>
 * </ul>
 *
 * <h2>Example code:</h2>
 *
 * <pre><code>
var timePicker = new Ext.ux.TimePicker();
timePicker.show();
 * </code></pre>
 *
 * <p>you may want to adjust the {@link #hourFrom}, {@link #hourTo} and {@link #minuteScale} properties:
 * <pre><code>
var timePicker = new Ext.ux.TimePicker({
    hourFrom: 8,
    hourTo  : 18,
	minuteScale: 5
});
timePicker.show();
 * </code></pre>
 *
 * @constructor
 * Create a new Timepicker
 * @param {Object} config The config object
 * @xtype timepicker
 */
Ext.ux.TimePicker = Ext.extend(Ext.Picker, {
    /**
     * @cfg {Number} minuteScale
     * List every how many minutes, eg. 5 lists 0, 5, 10, 15, etc. Defaults to 1
     */

	minuteScale: 1, 
	
    /**
     * @cfg {Number} hourFrom
     * The start hour for the time picker.  Defaults to 0
     */
    hourFrom: 0,

    /**
     * @cfg {Number} hourTo
     * The last hour for the time picker.  Defaults to 23
     */
    hourTo: 23,

    /**
     * @cfg {String} hourText
     * The label to show for the hour column. Defaults to 'Hour'.
     */
    hourText: 'Hour',

    /**
     * @cfg {String} minuteText
     * The label to show for the minute column. Defaults to 'Minute'.
     */
    minuteText: 'Minute',

    /**
     * @cfg {Array} slotOrder
     * An array of strings that specifies the order of the slots. Defaults to <tt>['hour', 'minute']</tt>.
     */
    slotOrder: ['hour', 'minute'],

    initComponent: function() {
        var hoursFrom = this.hourFrom,
            hoursTo = this.hourTo,
            hours = [],
            minutes = [],
            ln, tmp, i, j;

        // swap values if user mixes them up.
        if (hoursFrom > hoursTo) {
            tmp = hoursFrom;
            hoursFrom = hoursTo;
            hoursTo = tmp;
        }

        for (i = j = hoursFrom; i <= hoursTo; i++, j++) {
			j = (j+"").length > 1 ? j : "0"+j;
            hours.push({
                text: j,
                value: i
            });
        }

		for (i = j = 0; i <= 59; i = j = i + this.minuteScale) {
			j = (j+"").length > 1 ? j : "0"+j;
            minutes.push({
                text: j,
                value: i
            });
        }

        this.slots = [];

        this.slotOrder.forEach(function(item){
            this.slots.push(this.createSlot(item, hours, minutes ));
        }, this);

        Ext.ux.TimePicker.superclass.initComponent.call(this);
    },

    afterRender: function() {
        Ext.ux.TimePicker.superclass.afterRender.apply(this, arguments);

        this.setValue(this.value);
    },

    createSlot: function(name, hours, minutes ){
        switch (name) {
            case 'hour':
                return {
                    name: name,
                    align: 'right',
                    data: hours,
                    title: this.useTitles ? this.hourText : false,
                    flex: 5
                };
            case 'minute':
                return {
                    name: name,
                    align: 'left',
                    data: minutes,
                    title: this.useTitles ? this.minuteText : false,
                    flex: 5
                };
        }
    },

    // @private
    onSlotPick: function(slot, value) {

        Ext.ux.TimePicker.superclass.onSlotPick.apply(this, arguments);
    },

    /**
     * Gets the current value as a Time object
     * @return {hour: x, minute: y} value
     */
    getValue: function() {
        var value = Ext.ux.TimePicker.superclass.getValue.call(this);

        return value;
    },

    /**
     * Sets the values of the TimePicker's slots
     * @param {Date/Object} value The value either in a {hour:'value', minute:'value'} format or a String, eg: '18:00'
     * @param {Boolean} animated True for animation while setting the values
     * @return {Ext.DatePicker} this This DatePicker
     */
    setValue: function(value, animated) {
		if (Ext.isObject(value)) {
			this.value = value;
		} else {
			var arr = (value+"").split(':');
			this.value = {
				hour: parseInt(arr[0],10),
				minute: parseInt(arr[1],10)
			};
		}
         
        return Ext.ux.TimePicker.superclass.setValue.call(this, this.value, animated);
    }
});

Ext.reg('timepicker', Ext.ux.TimePicker);