API.Plugins.notes = {
	element:{
		table:{
			index:{},
			clients:{},
		},
	},
	options:{
		create:{
			skip:['by','relationship','link_to'],
		},
		update:{
			skip:['by','relationship','link_to'],
		},
	},
	init:function(){
		API.GUI.Sidebar.Nav.add('Notes', 'development');
	},
	load:{
		index:function(){
			API.Builder.card($('#pagecontent'),{ title: 'Notes', icon: 'notes'}, function(card){
				API.request('notes','read',{
					data:{options:{ link_to:'NotesIndex',plugin:'notes',view:'index' }},
				},function(result) {
					var dataset = JSON.parse(result);
					if(dataset.success != undefined){
						for(const [key, value] of Object.entries(dataset.output.results)){ API.Helper.set(API.Contents,['data','dom','notes',value.id],value); }
						for(const [key, value] of Object.entries(dataset.output.raw)){ API.Helper.set(API.Contents,['data','raw','notes',value.id],value); }
						API.Builder.table(card.children('.card-body'), dataset.output.results, {
							headers:dataset.output.headers,
							id:'NotesIndex',
							modal:true,
							key:'id',
							clickable:{ enable:true, view:'details'},
							controls:{ toolbar:true},
							import:{ key:'id', },
						},function(response){
							API.Plugins.notes.element.table.index = response.table;
						});
					}
				});
			});
		},
		details:function(){
			var url = new URL(window.location.href);
			var id = url.searchParams.get("id"), values = '';
			setTimeout(function() {
				$("[data-plugin="+url.searchParams.get("p")+"][data-key]").each(function(){
					values += $(this).html();
				});
				if(values == ''){
					API.request('notes','read',{data:{id:id,key:'name'}},function(result){
						var dataset = JSON.parse(result);
						if(dataset.success != undefined){
							API.GUI.insert(dataset.output.results);
						}
					});
				}
			}, 1000);
		},
	},
	extend:{
		clients:{
			init:function(){
				var url = new URL(window.location.href);
				if((typeof url.searchParams.get("v") !== "undefined")&&(url.searchParams.get("v") == 'details')){
					var checkExist = setInterval(function(){
						if(($('[data-plugin="clients"][data-key="id"]').html() != '')&&($('#clientsTabs').find('.tab-content').length > 0)){
							clearInterval(checkExist);
							var id = $('[data-plugin="clients"][data-key="id"]').html();
							API.Plugins.clients.Tabs.add('notes', function(tab){
								API.request('notes','read',{
									data:{filters:[
										{ relationship:'equal', name:'relationship', value:'clients'},
										{ relationship:'equal', name:'link_to', value:id},
									]},
									toast:false,
									pace:false,
								},function(result){
									var dataset = JSON.parse(result), html = '', etoast = false;
									if(typeof dataset.success !== 'undefined'){
										for(const [key, value] of Object.entries(dataset.output.results)){ API.Helper.set(API.Contents,['data','dom','notes',value.id],value); }
										for(const [key, value] of Object.entries(dataset.output.raw)){ API.Helper.set(API.Contents,['data','raw','notes',value.id],value); }
										API.Builder.table(tab, dataset.output.results, {
											headers:dataset.output.headers,
											id:'ClientsNotes',
											modal:true,
											key:'id',
											set:{
												relationship:'clients',
												link_to:id,
												by:API.Contents.Auth.User.id,
											},
											plugin:'notes',
											clickable:{
												enable:true,
												plugin:'notes',
												view:'details',
											},
											predifined:{
												relationship:'%plugin%',
												link_to:'%id%',
											},
											import:{ key:'id', },
											controls:{
												toolbar:true,
											},
											modalWidth:'modal-lg',
										}, function(table){
											API.Plugins.notes.element.table.clients = table.table;
										});
									}
								});
							});
						}
					}, 100);
				}
			},
		},
	},
}

API.Plugins.notes.init();
