Engine.Plugins.notes = {
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
		Engine.GUI.Sidebar.Nav.add('Notes', 'development');
	},
	load:{
		index:function(){
			Engine.Builder.card($('#pagecontent'),{ title: 'Notes', icon: 'notes'}, function(card){
				Engine.request('notes','read',{
					data:{options:{ link_to:'NotesIndex',plugin:'notes',view:'index' }},
				},function(result) {
					var dataset = JSON.parse(result);
					if(dataset.success != undefined){
						for(const [key, value] of Object.entries(dataset.output.dom)){ Engine.Helper.set(Engine.Contents,['data','dom','notes',value.id],value); }
						for(const [key, value] of Object.entries(dataset.output.raw)){ Engine.Helper.set(Engine.Contents,['data','raw','notes',value.id],value); }
						Engine.Builder.table(card.children('.card-body'), dataset.output.dom, {
							headers:dataset.output.headers,
							id:'NotesIndex',
							modal:true,
							key:'id',
							clickable:{ enable:true, view:'details'},
							controls:{ toolbar:true},
							import:{ key:'id', },
						},function(response){
							Engine.Plugins.notes.element.table.index = response.table;
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
					Engine.request('notes','read',{data:{id:id,key:'name'}},function(result){
						var dataset = JSON.parse(result);
						if(dataset.success != undefined){
							Engine.GUI.insert(dataset.output.dom);
						}
					});
				}
			}, 1000);
		},
	},
	Timeline:{
		icon:"sticky-note",
		object:function(dataset,layout,options = {},callback = null){
			if(options instanceof Function){ callback = options; options = {}; }
			var defaults = {icon: Engine.Plugins.notes.Timeline.icon,color: "warning"};
			for(var [key, option] of Object.entries(options)){ if(Engine.Helper.isSet(defaults,[key])){ defaults[key] = option; } }
			if(typeof dataset.id !== 'undefined'){
				var dateItem = new Date(dataset.created);
				var dateUS = dateItem.toLocaleDateString('en-US', {day: 'numeric', month: 'short', year: 'numeric'}).replace(/ /g, '-').replace(/,/g, '');
				Engine.Builder.Timeline.add.date(layout.timeline,dataset.created);
				var checkExist = setInterval(function() {
					if(layout.timeline.find('div.time-label[data-dateus="'+dateUS+'"]').length > 0){
						clearInterval(checkExist);
						Engine.Builder.Timeline.add.fileter(layout,'notes','notes');
						var html = '';
						if(typeof dataset.from !== 'undefined') { var user = dataset.from; }
						else if(typeof dataset.user !== 'undefined') { var user = dataset.user; }
						else if(typeof dataset.owner !== 'undefined') { var user = dataset.owner; }
						else { var user = ''; }
						if((typeof dataset.subject !== 'undefined')&&(dataset.subject != null)&&(dataset.subject != "")) { var subject = dataset.subject; }
						else if((typeof dataset.title !== 'undefined')&&(dataset.title != null)&&(dataset.title != "")) { var subject = dataset.title; }
						else { var subject = ''; }
						html += '<div data-plugin="notes" data-id="'+dataset.id+'" data-date="'+dateItem.getTime()+'">';
							html += '<i class="fas fa-'+defaults.icon+' bg-'+defaults.color+'"></i>';
							html += '<div class="timeline-item">';
								html += '<span class="time text-dark"><i class="fas fa-clock mr-2"></i><time class="timeago" datetime="'+dataset.created.replace(/ /g, "T")+'">'+dataset.created+'</time></span>';
								html += '<h3 class="timeline-header border-0 bg-'+defaults.color+'"><a class="mr-2">'+user+'</a>'+subject+'</h3>';
								html += '<div class="timeline-body">'+dataset.content+'</div>';
							html += '</div>';
						html += '</div>';
						layout.timeline.find('div.time-label[data-dateus="'+dateUS+'"]').after(html);
						var element = layout.timeline.find('[data-plugin="notes"][data-id="'+dataset.id+'"]');
						element.find('time').timeago();
						var items = layout.timeline.children('div').detach().get();
						items.sort(function(a, b){
							return new Date($(b).data("date")) - new Date($(a).data("date"));
						});
						layout.timeline.append(items);
						if(Engine.Auth.validate('plugin', 'notes', 4)){
							$('<a class="time text-dark pointer"><i class="fas fa-trash-alt"></i></a>').insertAfter(element.find('span.time'));
							element.find('a.pointer').off().click(function(){
								Engine.CRUD.delete.show({ keys:dataset,key:'id', modal:true, plugin:'notes' },function(note){
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
	Layouts:{
		details:{
			tab:function(data,layout,options = {},callback = null){
				if(options instanceof Function){ callback = options; options = {}; }
				var defaults = {field: "name"};
				for(var [key, option] of Object.entries(options)){ if(Engine.Helper.isSet(defaults,[key])){ defaults[key] = option; } }
				if(!Engine.Helper.isSet(layout,['content','notes'])){
					Engine.GUI.Layouts.details.tab(data,layout,{icon:"fas fa-sticky-note",text:Engine.Contents.Language["Notes"]},function(data,layout,tab,content){
						Engine.Builder.Timeline.add.filter(layout,'notes','Notes');
						layout.content.notes = content;
						layout.tabs.notes = tab;
						if(Engine.Auth.validate('plugin', 'notes', 2)){
							layout.content.notes.append('<div><textarea title="Note" name="note" class="form-control"></textarea></div>');
							layout.content.notes.find('textarea').summernote({
								toolbar: [
									['font', ['fontname', 'fontsize']],
									['style', ['bold', 'italic', 'underline', 'strikethrough', 'superscript', 'subscript', 'clear']],
									['color', ['color']],
									['paragraph', ['style', 'ul', 'ol', 'paragraph', 'height']],
								],
								height: 250,
							});
							var html = '';
							html += '<nav class="navbar navbar-expand-lg navbar-dark bg-dark">';
								html += '<form class="form-inline my-2 my-lg-0 ml-auto">';
									html += '<button class="btn btn-warning my-2 my-sm-0" type="button" data-action="reply"><i class="fas fa-sticky-note mr-1"></i>'+Engine.Contents.Language['Add Note']+'</button>';
								html += '</form>';
							html += '</nav>';
							layout.content.notes.append(html);
						}
					});
				}
				Engine.Plugins.notes.Layouts.details.Events(data,layout);
				if(callback != null){ callback(dataset,layout); }
			},
			GUI:{},
			Events:function(dataset,layout,options = {},callback = null){
				var url = new URL(window.location.href);
				if(options instanceof Function){ callback = options; options = {}; }
				var defaults = {field: "name"};
				for(var [key, option] of Object.entries(options)){ if(Engine.Helper.isSet(defaults,[key])){ defaults[key] = option; } }
				if(Engine.Auth.validate('plugin', 'notes', 2)){
					layout.content.notes.find('button').off().click(function(){
					  if(!layout.content.notes.find('textarea').summernote('isEmpty')){
					    var note = {
					      by:Engine.Contents.Auth.User.id,
					      content:layout.content.notes.find('textarea').summernote('code'),
					      relationship:url.searchParams.get("p"),
					      link_to:dataset.this.dom.id,
					      status:dataset.this.raw.status,
					    };
					    layout.content.notes.find('textarea').val('');
					    layout.content.notes.find('textarea').summernote('code','');
					    layout.content.notes.find('textarea').summernote('destroy');
					    layout.content.notes.find('textarea').summernote({
					      toolbar: [
					        ['font', ['fontname', 'fontsize']],
					        ['style', ['bold', 'italic', 'underline', 'strikethrough', 'superscript', 'subscript', 'clear']],
					        ['color', ['color']],
					        ['paragraph', ['style', 'ul', 'ol', 'paragraph', 'height']],
					      ],
					      height: 250,
					    });
					    Engine.request(url.searchParams.get("p"),'note',{data:note},function(result){
					      var data = JSON.parse(result);
					      if(data.success != undefined){
									Engine.Plugins.notes.Timeline.object(data.output.note.dom,layout);
					      }
					    });
					    layout.tabs.find('a').first().tab('show');
					  } else {
					    layout.content.notes.find('textarea').summernote('destroy');
					    layout.content.notes.find('textarea').summernote({
					      toolbar: [
					        ['font', ['fontname', 'fontsize']],
					        ['style', ['bold', 'italic', 'underline', 'strikethrough', 'superscript', 'subscript', 'clear']],
					        ['color', ['color']],
					        ['paragraph', ['style', 'ul', 'ol', 'paragraph', 'height']],
					      ],
					      height: 250,
					    });
					    alert(Engine.Contents.Language['Note is empty']);
					  }
					});
				}
			},
		},
	},
}

Engine.Plugins.notes.init();
