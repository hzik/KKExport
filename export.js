var items = [];

$(document).ready(function()
{		
	$("#submit").click(function() {
		items = [];
		$("#tables").html("");
		loadJSON($("#project").val(), $("#lang").val(), '', $("#prev").val());
	});
});

function loadJSON(project,lang,xc,prev) {
	var url = 'https://'+(prev?'preview-':'')+'deliver.kontent.ai/'+project+'/items-feed?order=system.type[asc]'+(lang?'&language='+lang:'');
	$.ajax({
		url: url,
		dataType: 'text',		
		beforeSend: function(xhr, settings) { 
			if (xc) {
				xhr.setRequestHeader('X-Continuation',xc);
			}
			if (prev) {
				xhr.setRequestHeader('Authorization','Bearer '+prev);
			}
		},
		success: function (data, textStatus, request) {
			data = JSON.parse(data);
			if (data.items.length > 0) {
				processData(data.items);
				var xc = request.getResponseHeader('X-Continuation');
				if (xc) {
					loadJSON(project,lang,xc,prev);
				}
				else {
					buildData(0);					
				}
			}
			else {
				console.log("no data found");
				$("#msg").html("No data found. Please make sure your project has items in specified language.");
			}
		},
		error:function(jqXHR, textStatus, errorThrown){
			 $("#msg").html("No data found. Please make sure you have correct project id, language and the API key.");
		} 
	});	
}
function processData(data) {
	for (var x = 0; x < data.length; x++) {
		items.push(data[x]);
	}
}

function buildData(index) {
	var type = items[index].system.type;
	var fields = [];
	var table = '<table class="display compact" id="table_'+index+'">';
	var xml = '<items>\n';
	table += '<thead>';
	table += '<tr>';
	for (var key in items[index].elements) {
		table += '<th>';
		table += items[index].elements[key].name;
		fields.push(key);
		table += '</th>';
	}
	table += '</tr>';
	table += '</thead>';
	table += '<tbody>';
	for(var y = index; y < items.length; y++) {	
		table += '<tr>';
		xml += '\t<item>\n';
		for(var x = 0; x < fields.length; x++) {
			table += '<td>';	
			xml += '\t\t<'+fields[x]+'>\n';	
			switch (items[y].elements[fields[x]].type) {
				case 'multiple_choice':
				case 'taxonomy':
					for(var z = 0; z < items[y].elements[fields[x]].value.length; z++) {
						table += items[y].elements[fields[x]].value[z].name+'<br />';
						xml += '\t\t\t'+items[y].elements[fields[x]].value[z].name+'\n';
					}						
					break;					
				case 'asset':						
					for(var z = 0; z < items[y].elements[fields[x]].value.length; z++) {
						table += items[y].elements[fields[x]].value[0].url+'<br />';
						xml += '\t\t\t'+items[y].elements[fields[x]].value[0].url+'\n';
					}											
					break;	
				default:
					table += items[y].elements[fields[x]].value;
					xml += '\t\t\t'+items[y].elements[fields[x]].value+'\n';
			}
			
			table += '</td>';			
			xml += '\t\t</'+fields[x]+'>\n';			
		}
		table += '</tr>';
		xml += '\t</item>\n';
		if (items.length == y+1) {
			table += '</tbody>';
			table += '</table>';
			xml += '</items>';
			$("#tables").append('<h1>'+type+'</h1>'+table);	
			addExport(xml,index);
		}	
		else {		
			if (items[y+1].system.type != type) {
				table += '</tbody>';
				table += '</table>';
				xml += '</items>';
				$("#tables").append('<h1>'+type+'</h1>'+table);	
				addExport(xml,index);
				buildData(y+1);
				break;
			}
		}
	}
}

function addExport(xml,index) {
	$('#table_'+index).DataTable( {
		dom: 'Bfrtip',
		buttons: [
			{
				extend: 'copyHtml5',
				title: 'Data export',
				text: '<i class="fa fa-files-o"></i>',
				titleAttr: 'Copy'
			},
			{
				extend: 'excelHtml5',
				title: 'Data export',
				text: '<i class="fa fa-file-excel-o"></i>',
				titleAttr: 'Excel'
			},
			{
				extend: 'pdfHtml5',
				title: 'Data export',
				text: '<i class="fa fa-file-pdf-o"></i>',
				titleAttr: 'PDF'
			},
			{
                text: '<i class="fa fa-file-code-o"></i>',
				titleAttr: 'XML',
                action: function ( e, dt, node, config ) {
                    var w = window.open(null, null, config='height=600,width=800, addressbar=no');
					w.document.open("text/xml");
					w.document.write('<pre><code>' + escapeHtml(xml) + '</code></pre>');
					w.document.close();
                }
            },
			{
				extend: 'print',
				title: 'Data export',
				text: '<i class="fa fa-print"></i>',
				titleAttr: 'Print'
			}
		]
	} );
}

var entityMap = {
  '\n': '<br />',
  '\t': '&nbsp;',
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#39;',
  '/': '&#x2F;',
  '`': '&#x60;',
  '=': '&#x3D;'
};

function escapeHtml(string) {
  return String(string).replace(/[&<>"'`=\/]/g, function (s) {
    return entityMap[s];
  });
}
