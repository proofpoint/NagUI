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

var NodeContextMenu= new Ext.menu.Menu({
	id:'nodecontextmenu',
	// width: 200,
	items:[
		{
			id:'menulabel',
			text:'',
			handler: function(i)
			{
				var node=i.parentMenu.contextNode;
				if(typeof moreInfo=='function')
				{
					moreInfo(node.data.host_name || node.data.name);					
				}
				else
				{
					updateNagiosInfoPanel(i.parentMenu.contextView,i.parentMenu.contextNode);
				}
			}
		}
		,
		new Ext.menu.Separator(),
		{
			id:'refresh',
			text: 'Refresh',
			iconCls: 'x-tbar-loading',
			handler: function(i)
			{
				var node=i.parentMenu.contextNode;
				i.parentMenu.contextView.ownerCt.store.refreshNode(node,i.parentMenu.contextView);
			}
		},
		{	
			id:'recheck',
			iconCls:'x-tree-refresh',
			text: 'Re-Check',
			setShow: function(n,v){
				if( n.data.nagios_type!='host' && n.data.nagios_type!='service' )
				{
					this.hide();
				}
			},
			handler: function(i)
			{
				var node=i.parentMenu.contextNode;
				scheduleRecheck(node);
			}
			// ,
			// menu:{
			// 	items:[
			// 		{
			// 			text:'Run Live',
			// 			handler:function(i){
			// 				var node=i.parentMenu.parentMenu.contextNode;
			// 				// recheckNow(node);
			// 				i.parentMenu.parentMenu.contextView.ownerCt.store.recheckNow(node,i.parentMenu.parentMenu.contextView);
			// 				
			// 			}
			// 		}
			// 	]
			// }		
		},
		{	
			id:'ack',
			iconCls:'x-tree-ack',
			text: 'Acknowledge',
			setShow: function(n,v){
				if( ( n.data.nagios_type=='host' || n.data.nagios_type=='service') && n.data.state == 0 )
				{
					this.hide();
				}
			},
			handler: function(i)
			{
				var node=i.parentMenu.contextNode;
				ackWindow(node);
			}
		},
		{	
			id:'enablealerts',
			iconCls:'x-tree-notify',
			text: 'Enable Alerts',
			setShow: function(n,v){
				if( ( n.data.nagios_type=='host' || n.data.nagios_type=='service') && n.data.notifications_enabled == 1 )
				{
					this.hide();
				}
			},
			handler: function(i)
			{
				var node=i.parentMenu.contextNode;
				if(typeof node != 'undefined')
				{
					toggleAlerts(node,'ENABLE');
				}
			}
		},
		{	
			id:'disablealerts',
			iconCls:'x-tree-ndisabled',
			text: 'Disable Alerts',
			setShow: function(n,v){
				if( ( n.data.nagios_type=='host' || n.data.nagios_type=='service') && n.data.notifications_enabled == 0 )
				{
					this.hide();
				}
			},
			handler: function(i)
			{
				var node=i.parentMenu.contextNode;
				if(typeof node != 'undefined')
				{
					toggleAlerts(node,'DISABLE');
				}
			}
		},
		{	
			id:'schedule',
			iconCls:'x-tree-schedule',
			text: 'Schedule Downtime',
			handler: function(i)
			{
				var node=i.parentMenu.contextNode;
				scheduleDowntimeWindow(node);
			}
		},
		{	
			id:'removedowntime',
			iconCls:'x-tree-schedule',
			text: 'Remove Downtime',
			setShow: function(n,v){
				if( n.data.downtimes_with_info == '' || n.data.downtimes_with_info.length == 0 )
				{
					this.hide();
				}
			},
			handler: function(i)
			{
				var node=i.parentMenu.contextNode;
				removeDowntime(node);
			}
		},
		{	
			id:'comment',
			iconCls:'x-tree-comment',
			text: 'Add Comment',
			handler: function(i)
			{
				var node=i.parentMenu.contextNode;
				commentWindow(node);
			}
		},
		{
			text: 'Submit Check',
			handler: function(i){
				var node=i.parentMenu.contextNode;
				submitcheckWindow(node);
			}
		},
		{
			id: 'expandall',
			text: 'Expand All',
			setShow: function(n,v){
				if( n.data.leaf )
				{
					this.hide();
				}
			},
			handler: function(i)
			{
				var node=i.parentMenu.contextNode;
				expandAllChildNodes(node);
			}
		},
		{
			id: 'collapseall',
			text: 'Collapse All',
			setShow: function(n,v){
				if( n.data.leaf || !n.data.expanded )
				{
					this.hide();
				}
			},
			handler: function(i)
			{
				var node=i.parentMenu.contextNode;
				node.cascadeBy(function(n){
					n.collapse();
				});
			}
		},
		{
			id:'checkall',
			text: 'Select all',
			setShow: function(n,v){
				if( n.data.leaf )
				{
					this.hide();
				}
			},
			handler: function(i)
			{
				var node=i.parentMenu.contextNode;
				node.cascadeBy(function(n){
					n.set('checked',true);
				});
			}
		},
		{
			id:'remove',
			text: 'Remove Node',
			handler: function(i)
			{
				var node=i.parentMenu.contextNode;
				// if(node.getPath('text').match('/Custom View')!=null)
				// {					
					node.remove();
				// }
			}
		},
		{
			id:'moreinfo',
			text: 'More Info...',
			setShow: function(n,v){
				if( typeof moreInfo != 'function' )
				{
					this.hide();
				}
			},
			handler: function(i)
			{
				var node=i.parentMenu.contextNode;
				if(typeof moreInfo == 'function' && (node.data.nagios_type == 'host' || node.data.nagios_type == 'service' ) )
				{
					moreInfo(node.data.host_name || node.data.name);					
				}
			}
		},
		{
			id: 'logs',
			text: 'View Logs',
			handler: function(i)
			{
				var node=i.parentMenu.contextNode;
				NagUI.setupLogWindow({
					host_name: node.data.host_name ? node.data.host_name : node.data.name,
					service_description: node.data.description,
					peer_name: node.data.peer_name
					
				});
			}
		}
	],
	reset: function() {
		this.items.each(function(i){
			i.show();
		});	
	},
	setItems: function(){
		this.items.each(function(i){
			if(typeof i['setShow'] == 'function')
			{
				i.setShow(this.contextNode,this.contextView);
			}
		},this);		
	}
});
function expandAllChildNodes(n)
{
	n.expand(function(){
		for (var i = 0; i < this.childNodes.length; i++)
		{
			expandAllChildNodes(this.childNodes[i]);
		}
	},n);
}
function doNodeContextMenu(view,node,item,index,e)
{
// Register the context node with the menu so that a Menu Item's handler function can access
// it via its parentMenu property.
	//node.select();
	var c = view.panel.contextMenu;
	c.contextNode = node;
	c.contextView=view;
	// reset 
	c.reset();
	c.setItems();

	if(typeof node.data.text!='undefined' && typeof node.data.nagios_type!='undefined')
	{
		c.items.get('menulabel').setText(node.data.nagios_type + ': ' + node.data.text);
		c.items.get('menulabel').setIconCls(node.data.iconCls);
	}
	c.doComponentLayout();
	// if(node.getPath('text').match('/Custom View')==null || node.getPath('text') == '/Custom View' )
	// {
	// 	c.items.get('remove').disable();
	// }
	// else
	// {
	// 	c.items.get('remove').enable();		
	// }
	e.preventDefault();
	c.showAt(e.getXY());
}

