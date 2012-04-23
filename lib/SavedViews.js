/* Copyright 2010-2011 Proofpoint, Inc. All rights reserved.

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

    http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
*/

Ext.define('NagUI.SavedViews',{
	extend:'Ext.tree.Panel',
	alias: 'widget.savedviews',
	viewConfig: {
		plugins: {
			ptype: 'treeviewdragdrop',
			ddGroup: 'saved_viewsDD'
		}
	},
	store: new Ext.data.TreeStore({
		root: {
			expanded: true,
			allowDrop: false,
			children: [
				{
					text: 'Shared Views',
					leaf: false,
					allowDrop: true,
					expanded: true,
					children: []
				},
				{
					text: NagUI.username + '-Views',
					leaf: false,
					allowDrop: true,
					expanded: true,
					children: []
				}
			]
		}
	}),
	rootVisible: false,
	listeners:{
		itemclick: {
			fn: function(view,rec,item){
				if(rec.data.leaf)
				{
					var viewLkup = Ext.getCmp('nagios_views').items.findIndex('stateId',rec.data.text);
					if( viewLkup >= 0)
					{
						Ext.getCmp('nagios_views').setActiveTab(viewLkup);
					}
					else
					{
						var newview=addCustomView(rec.data.text);
						newview.applyState(rec.data.viewstate);
					}
				}
			}
		},
		itemappend:{
			fn: function(parentnode,newnode){
				persistSavedViews('default');
				persistSavedViews();
				Ext.notify.msg('Success','Views saved');
			}
		},
		itemremove:{
			fn: function(parentnode,newnode){
				persistSavedViews('default');
				persistSavedViews();
			}
		},
		expand: {
			scope: this,
			single: true,
			fn: function(saved_views){
				// Not sure if this will be a problem resetting these functions every time the panel is exapnded
				// if(typeof saved_views.view.plugins[0].dragZone.beforeDragOver == 'undefined')
				// {
					saved_views.view.plugins[0].dragZone.beforeDragOver=function(){
						saved_views.deleteZone.setText('Drop to delete'); 
						saved_views.deleteZone.up('toolbar').getEl().setStyle('background', '#ff6161');
					};
					saved_views.view.plugins[0].dragZone.beforeDragOut=function(){
						saved_views.deleteZone.setText('Drop to delete'); 
						saved_views.deleteZone.up('toolbar').getEl().setStyle('background', '#ff6161');
					};
					saved_views.view.plugins[0].dragZone.afterDragDrop= function(){ 
						saved_views.deleteZone.setText('Drag to reorder');
						saved_views.deleteZone.up('toolbar').getEl().setStyle('background', '');
					};	
					if(Ext.dd.DragDropManager.isDragDrop(saved_views.deleteZone.getEl().id) == false )
					{
						new Ext.dd.DropZone(saved_views.deleteZone.getEl(),{
							ddGroup:'saved_viewsDD',
							getTargetFromEvent: function(e){
								return saved_views.deleteZone.getEl();
							}, 
							onNodeOver : function(target, dd, e, data){ 
					            return Ext.dd.DropZone.prototype.dropAllowed;
					        },
					        onNodeDrop : function(nodeData, source, e, data){
								Ext.each(data.records,function(r){
									r.parentNode.removeChild(r);
								});
								return true;
					        }			
						});
					}

				// }									
			}
		}
	},
	initComponent: function() {
		this.deleteZone=new Ext.toolbar.TextItem({
			text: 'Drag to reorder',
			style:{
				'font-weight': 'bold',
				'font-size': '13px'
			}
		});
		this.bbar=[
			{xtype:'tbfill'},
			this.deleteZone,
			{xtype:'tbfill'}
		];
		NagUI.SavedViews.superclass.initComponent.call(this);
		// 
		// this.view.plugins[0].dragZone.beforeDragOver=function(){
		// 	me.deleteZone.setText('Drop to delete'); 
		// 	me.deleteZone.getEl().setStyle('background', '#ff6161');
		// };
		// this.view.plugins[0].dragZone.beforeDragOut=function(){
		// 	me.deleteZone.setText('Drop to delete'); 
		// 	me.deleteZone.getEl().setStyle('background', '#ff6161');
		// };
		// this.view.plugins[0].dragZone.afterDragDrop= function(){ 
		// 	me.deleteZone.setText('Drag to reorder');
		// 	me.deleteZone.getEl().setStyle('background', '');
		// };	
		// if(Ext.dd.DragDropManager.isDragDrop(this.dockedItems.items[2].getEl().id) == false )
		// {
		// 	new Ext.dd.DropZone(me.deleteZone.getEl(),{
		// 		ddGroup:'saved_viewsDD',
		// 		getTargetFromEvent: function(e){
		// 			return me.deleteZone.getEl();
		// 		}, 
		// 		onNodeOver : function(target, dd, e, data){ 
		//             return Ext.dd.DropZone.prototype.dropAllowed;
		//         },
		//         onNodeDrop : function(nodeData, source, e, data){
		// 			Ext.each(data.records,function(r){
		// 				r.parentNode.removeChild(r);
		// 			});
		// 			return true;
		//         }			
		// 	});
		// }
	}
	
});
