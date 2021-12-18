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
						for(const [key, value] of Object.entries(dataset.output.dom)){ API.Helper.set(API.Contents,['data','dom','notes',value.id],value); }
						for(const [key, value] of Object.entries(dataset.output.raw)){ API.Helper.set(API.Contents,['data','raw','notes',value.id],value); }
						API.Builder.table(card.children('.card-body'), dataset.output.dom, {
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
							API.GUI.insert(dataset.output.dom);
						}
					});
				}
			}, 1000);
		},
	},
	Timeline:{
		icon:"history",
		object:function(dataset,layout,options = {},callback = null){
			if(options instanceof Function){ callback = options; options = {}; }
			var defaults = {icon: API.Plugins.notes.Timeline.icon,color: "primary"};
			if(API.Helper.isSet(options,['icon'])){ defaults.icon = options.icon; }
			if(API.Helper.isSet(options,['color'])){ defaults.color = options.color; }
			if(typeof dataset.id !== 'undefined'){
				var dateItem = new Date(dataset.created);
				var dateUS = dateItem.toLocaleDateString('en-US', {day: 'numeric', month: 'short', year: 'numeric'}).replace(/ /g, '-').replace(/,/g, '');
				API.Builder.Timeline.add.date(layout.timeline,dataset.created);
				var checkExist = setInterval(function() {
					if(layout.timeline.find('div.time-label[data-dateus="'+dateUS+'"]').length > 0){
						clearInterval(checkExist);
						var html = '';
						if(typeof dataset.from !== 'undefined') { var user = dataset.from; }
						else if(typeof dataset.user !== 'undefined') { var user = dataset.user; }
						else if(typeof dataset.owner !== 'undefined') { var user = dataset.owner; }
						else { var user = ''; }
						if((typeof dataset.subject !== 'undefined')&&(dataset.subject != null)&&(dataset.subject != "")) { var subject = dataset.subject; }
						else if((typeof dataset.title !== 'undefined')&&(dataset.title != null)&&(dataset.title != "")) { var subject = dataset.title; }
						else { var subject = ''; }
						html += '<div data-type="'+icon+'" data-id="'+dataset.id+'" data-date="'+dateItem.getTime()+'">';
							html += '<i class="fas fa-'+icon+' bg-'+color+'"></i>';
							html += '<div class="timeline-item">';
								html += '<span class="time bg-'+color+'"><i class="fas fa-clock mr-2"></i><time class="timeago" datetime="'+dataset.created.replace(/ /g, "T")+'">'+dataset.created+'</time></span>';
								html += '<h3 class="timeline-header bg-'+color+'"><a class="mr-2">'+user+'</a>'+subject+'</h3>';
								html += '<div class="timeline-body">'+dataset.content+'</div>';
							html += '</div>';
						html += '</div>';
						layout.timeline.find('div.time-label[data-dateus="'+dateUS+'"]').after(html);
						var element = layout.timeline.find('[data-type="'+icon+'"][data-id="'+dataset.id+'"]');
						element.find('time').timeago();
						var items = layout.timeline.children('div').detach().get();
						items.sort(function(a, b){
							return new Date($(b).data("date")) - new Date($(a).data("date"));
						});
						layout.timeline.append(items);
						if(API.Auth.validate('plugin', 'notes', 4)){
							$('<a class="time bg-warning pointer"><i class="fas fa-trash-alt"></i></a>').insertAfter(element.find('span.time.bg-warning'));
							element.find('a.pointer').off().click(function(){
								API.CRUD.delete.show({ keys:dataset,key:'id', modal:true, plugin:'notes' },function(note){
									element.remove();
								});
							});
						}
						if(callback != null){ callback(element); }
					}
				}, 100);
			}
		},
	},
}

API.Plugins.notes.init();
