Ext.ns('Ext.ux.form');
/**
 * @class Ext.ux.form.TimePicker
 * @extends Ext.form.Field
 * 
Specialized field which has a button which when pressed, shows a {@link Ext.ux.TimePicker}.


 * @xtype timepickerfield
 */
Ext.ux.form.TimePicker = Ext.extend(Ext.form.Field, {
    ui: 'select',

	/**
     * @cfg {Number} minuteScale
     * List every how many minutes, eg. 5 lists 0, 5, 10, 15, etc. Defaults to 1
     */
    minuteScale: 1, 
    
	/**
     * @cfg {Object/Ext.ux.TimePicker} picker
     * An object that is used when creating the internal {@link Ext.ux.TimePicker} component or a direct instance of {@link Ext.ux.TimePicker}
     * Defaults to null
     */
    picker: null,

    
	/**
     * @cfg {Object/Time} value
     * Default value for the field and the internal {@link Ext.ux.TimePicker} component. Accepts an object of 'hour', 
     * and 'minute' values, all of which should be numbers, or a Time string.
     * 
     * Example: {hour: 18, minute: 15} = 18:15
     */
	/**
     * @cfg {Boolean} destroyPickerOnHide
     * Whether or not to destroy the picker widget on hide. This save memory if it's not used frequently, 
     * but increase delay time on the next show due to re-instantiation. Defaults to false
     */
    destroyPickerOnHide: false,

    // @cfg {Number} tabIndex @hide

    // @cfg {Boolean} useMask @hide
    
    // @private
    initComponent: function() {
        this.addEvents(
            
			/**
             * @event change
             * Fires when a Time is selected
             * @param {Ext.ux.form.TimePicker} this
             * @param {Time} Time The new Time
             */
            'change'
        );

        this.tabIndex = -1;
        this.useMask = true;

        Ext.form.Text.superclass.initComponent.apply(this, arguments);
    },

    
	/**
     * Get an instance of the internal Time picker; will create a new instance if not exist.
     * @return {Ext.ux.TimePicker} TimePicker
     */
    getTimePicker: function() {
        if (!this.timePicker) {
            if (this.picker instanceof Ext.ux.TimePicker) {
                this.timePicker = this.picker;
            } else {
                this.timePicker = new Ext.ux.TimePicker(Ext.apply(this.picker || { minuteScale: this.minuteScale }));
            }

            this.timePicker.setValue(this.value || null);

            this.timePicker.on({
                scope : this,
                change: this.onPickerChange,
                hide  : this.onPickerHide
            });
        }

        return this.timePicker;
    },

    /**
     * @private
     * Listener to the tap event of the mask element. Shows the internal {@link #timePicker} component when the button has been tapped.
     */
    onMaskTap: function() {
        if (Ext.ux.form.TimePicker.superclass.onMaskTap.apply(this, arguments) !== true) {
            return false;
        }
        
        this.getTimePicker().show();
    },
    
    /**
     * Called when the picker changes its value
     * @param {Ext.ux.TimePicker} picker The time picker
     * @param {Object} value The new value from the time picker
     * @private
     */
    onPickerChange : function(picker, value) {
        this.setValue(value);
        this.fireEvent('change', this, this.getValue());
    },
    
    /**
     * Destroys the picker when it is hidden, if
     * {@link Ext.ux.form.icker#destroyPickerOnHide destroyPickerOnHide} is set to true
     * @private
     */
    onPickerHide: function() {
        if (this.destroyPickerOnHide && this.timePicker) {
            this.timePicker.destroy();
        }
    },

    // inherit docs
    setValue: function(value, animated) { 
        if (this.timePicker) {
            this.timePicker.setValue(value, animated);
            this.value = (value != null) ? this.timePicker.getValue() : null;
        } else {
            if (Ext.isObject(value)) {
				var hour = value.hour+"";
				hour = hour.length == 1 ? 0 + hour : hour;
				var minute = value.minute+"";
				minute = minute.length == 1 ? 0 + minute : minute;
				this.value =  hour+":"+minute;
            } else {
                this.value = value;
            }
        }

        if (this.rendered) {
            this.fieldEl.dom.value = this.getValue(true);
        }
        
        return this;
    },
    
    
	/**
     * Returns the value of the field, which will be a {@link Time} unless the format parameter is true.
     * @param {Boolean} format True to format the value with Ext.util.Format.defaultTimeFormat
     */
    getValue: function(format) {
        var value = this.value || null;

		if (Ext.isObject(value)) {
			var hour = value.hour+"";
			hour = hour.length == 1 ? 0 + hour : hour;
			var minute = value.minute+"";
			minute = minute.length == 1 ? 0 + minute : minute;
			return hour+":"+minute;
		}
		return value;
    },
    
    // @private
    onDestroy: function() {
        if (this.timePicker) {
            this.timePicker.destroy();
        }
        
        Ext.ux.form.TimePicker.superclass.onDestroy.call(this);
    }
});

Ext.reg('timepickerfield', Ext.ux.form.TimePicker);