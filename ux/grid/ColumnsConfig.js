Ext.define('Ext.ux.grid.ColumnsConfig', {
    extend: 'Ext.grid.feature.Feature',
    alias: 'feature.columnsconfig',
    constructor : function (config) {
        var me = this;

        config = config || {};
        Ext.apply(me, config);
        me.deferredUpdate = Ext.create('Ext.util.DelayedTask', me.reload, me);
    },
    showMenu : true,
	menuItemText: 'Add/Remove Columns',
    getGridPanel: function() {
        return this.view.up('gridpanel');
    },
    /**
     * @private Handle creation of the grid's header menu. Initializes the filters and listens
     * for the menu being shown.
     */
    onMenuCreate: function(headerCt, menu) {
        var me = this;
        menu.on('beforeshow', me.onMenuBeforeShow, me);
    },
    /**
     * @private Handle showing of the grid's header menu. Sets up the filter item and menu
     * appropriate for the target column.
     */
    onMenuBeforeShow: function(menu) {
       var me = this,
            menuItem;

        if (me.showMenu) {
            menuItem = me.menuItem;
            if (!menuItem || menuItem.isDestroyed) {
                me.createMenuItem(menu);
                menuItem = me.menuItem;
            }

            menuItem.setVisible(true);
        }
    },
    init: function(grid) {
        var me = this,
            view = me.view,
            headerCt = view.headerCt;
            // grid = me.getGridPanel();

        // Listen for header menu being created
        headerCt.on('menucreate', me.onMenuCreate, me);

    },
    createMenuItem: function(menu) {
        var me = this;
        me.menuItem = menu.add({
            itemId: 'columnsconfig',
            text: me.menuItemText,
            cls: Ext.baseCSSPrefix + 'cols-icon',
			handler: function()
			{
				this.adjustGridColumns();
			},
			scope: me.getGridPanel()
        });
    }
});