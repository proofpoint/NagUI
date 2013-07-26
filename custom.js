/*
This file is automatically loaded after the nagui JS files.  
Apply any install specific customizations here.  some example custom functions and integration
are listed below


customNodes are added to the Nagios Browser pane (left-hand) 
before the Hostgroups and Services and are expanded by referencing a query from NagUI.nodeQueries. 
custome nodes require entries in NagUI.nodeQueries to expand

example: 

NagUI.customNodes=[{
    text: 'Business',
    meta: 1,
    allowDrag:false,
    parms:{
        groupby:'name',
        nodetext: 'name',
        query: 'business'
    }
}];
NagUI.nodeQueries.business='GET hostgroups|Columns: name num_hosts num_services_ok num_services_warn num_services_crit num_services_unknown|Filter: name = Sales|Filter: name = Support|Filter: name = Mail|Or: 3';


*/

NagUI.customNodes=[];



//  Uncomment the function below and customize to integrate with your ticketing system.  
//  the ackTicket receives three parameters, the node(s) that is being passed to it (this could
// be an array of nodes), the formData from the ackWindow and a call be to called after a 
// ticket has been created.  the callback should be called with 
//  (ticket numer, dialog object that should be closed <optional> 
// function ackTicket(node, formData, callback)
// {
//  
// }


// Custom function for displaying information about a host.  Example: integration with cmdb or asset system
// function moreInfo(hostname){
// }

//example: function overrides the default (in nagiosnew.js) to add links for jira tickets
// function replaceURLWithHTMLLinks(text) {
//     var exp = /(\b(https?|ftp|file):\/\/[-A-Z0-9+&@#\/%?=~_|!:,.;\*]*[-A-Z0-9+&@#\/%=~_|])/ig;
//     var newtext=text.replace(exp,"<a target=_new href='$1'>$1</a>");
       // //  regex based on jira project short code  
//     var jira=/(OPS-\d{2,5})/ig;
//     return  newtext.replace(jira,"<a target=_new href='https://JIRASERVER/jira/browse/$1'>$1</a>"); 
// }
