function Class() { }
Class.clone = function( origin ) {
    var target = origin;

    if( 'number' == typeof origin ) {return 1*origin;}
    if( 'string' == typeof origin ) {return ''+origin;}
    if( 'function' == typeof origin || 'undefined' == typeof origin || null == origin ) {return target;}

    if( origin instanceof Array ) {
        target = new Array();
        origin.map( function(item) {target.push(item);} );
        return target;
    }

    if( origin instanceof Date ) {
        target = new Date(origin.getTime());
        return target;
        }

    target = new Object();
    for( var field in origin ) {
        if( origin[field]==origin ) {target[field]=target;continue;}
        target[field] = Class.clone(origin[field]);
        }
    return target;
    }

Class.prototype.construct = function() {};
Class.extend = function(nameOrDef, maybeDef) {
    var name = 'classDef';var def = nameOrDef;
    if( 'string' == typeof nameOrDef ) {name = nameOrDef;def = maybeDef;}
    eval('var '+name+' = function() { if("function" == typeof this.construct && arguments[0] !== Class) { this.construct.apply(this, arguments); } };');


    var proto = new this(Class);
    var superClass = this.prototype;
/*
    if('undefined'==typeof proto.__parent__) {
        proto.__parent__ = new Object();
        }

    if('undefined'==typeof proto.__parents__) {
        proto.__parents__ = new Array();
        proto.__parents__.unshift( proto );
        proto.__parentsDepth__ = 1;
        }
    if( 0 < proto.__parentsDepth__ && proto.__parents__[0] !== proto ) {
        proto.__parents__.unshift( Class.clone(proto) );
        proto.__parentsDepth__++;
        }


    for (var m in proto) {
        if( 'function' == typeof proto[m] ) {
            proto.__parent__[m] = proto[m];
            }
        }
*/
    var parentConstructor = this;
    if( 'function' == typeof proto.construct ) { parentConstructor = proto.construct; }
    proto.__super__ = function() {
        parentConstructor.apply( this, arguments );
        }


    for (var n in def) {
        var item = def[n];
        if (item instanceof Function) {
            item.$ = superClass;
            }
        proto[n] = item;
        }


  eval( name+'.prototype = proto;' );

  //Give this new class the same static extend method
  eval( name+'.extend = this.extend;' );
  return eval( name );
  };

var  EventtableObject = Class.extend(
    'EventableObject', {
         "_suspendEvents": false
        ,"_VALID_EVENT_NAMES": ["change"]

        ,"on": function() {
            // ARGS: event, data?, function
            if( arguments.length < 2 ) {return;}
            var fullEvent=arguments[0];
            var callback=arguments[arguments.length-1];

            var data={};
            if( 3 == arguments.length ) {
                data = arguments[1];
                }

            var event = fullEvent;
            if( fullEvent.indexOf('.') > 0 ) {event = fullEvent.substr(0,fullEvent.indexOf('.'));}
            event = event.toLowerCase();


            if( 'undefined' == typeof this._BINDINGS )          { this._BINDINGS = {}; }
            if( 'undefined' == typeof this._BINDINGS[ event ] ) {
                this._BINDINGS[ event ] = [];
                }
            else if( 'number' == typeof callback.$ObjectEventableId ) {
                var bindingIdx=this._BINDINGS[ event ].length-1;var found = false;
                while( !found && bindingIdx >= 0 ) {
                    found = found || this._BINDINGS[ event ][ bindingIdx ].callback.$ObjectEventableId == callback.$ObjectEventableId;
                    ++bindingIdx;
                    }
                if( found ) {return ;}
                }

            if( 'number' != typeof callback.$ObjectEventableId ) {
                callback.$ObjectEventableId = EventtableObject._internalSequence++;
                }
            callback.$FullEventName = fullEvent;

            var obj = {
                 'data': data
                ,'event': fullEvent
                ,'callback': callback};
            this._BINDINGS[ event ].push( obj );

            return callback.$ObjectEventableId;
            }  //  END method on()


        ,"off": function() {
            // ARGS: event, callbackId|function

            var callbackId = -1;
            var fullEventName  = arguments[0];
            var eventName = fullEventName;

            if( fullEventName.indexOf('.') > 0 ) {
                eventName = fullEventName.substr(0,fullEventName.indexOf('.'));
                }
            else {
                if( 'number' == typeof arguments[1] && !isNaN( parseInt(arguments[1],10) ) ) {
                    callbackId = parseInt(arguments[1],10);
                    }
                if( ('function' == typeof arguments[1] || 'object' == typeof arguments[1] ) && 'number' == typeof arguments[1].$ObjectEventableId ) {
                    callbackId = arguments[1].$ObjectEventableId;
                    }

                if( 0 > callbackId ) {return;}
                }

            if( 'undefined' == typeof this._BINDINGS[ eventName ] || 0 == this._BINDINGS[ eventName ].length ) {return;}

            var idx=this._BINDINGS[ eventName ].length-1;
            while( idx>=0 ) {
                var callback = this._BINDINGS[ eventName ][ idx ].callback;

                if( fullEventName.indexOf('.') > 0 ) {
                    // if namespaced event

                    if( callback.$FullEventName == fullEventName ) {this._BINDINGS[ eventName ].splice( idx, 1 );}
                    }
                else {
                    // Use callbackId

                    if( callback.$ObjectEventableId == callbackId ) {this._BINDINGS[ eventName ].splice( idx, 1 );}
                    }


                --idx;
                }
            }  //  END method off()

        ,"trigger": function( eventName, itemsData ) {
            eventName = eventName.toLowerCase();
            if( 'undefined' == typeof this._BINDINGS )              {return;}
            if( 'undefined' == typeof this._BINDINGS[ eventName ] ) {return;}

            if( 'object' != typeof itemsData || null == itemsData ) {itemsData = new Object();}

            if( this._suspendEvents ) {return;}
            if( 0 >= this._BINDINGS[ eventName ].length ) {return;}

            var event     = {
                 "target":    this
                ,"timeStamp": (new Date()).getTime()
                ,"items":     itemsData
                };

            var callbackArguments = [];callbackArguments.push( event );

            for( var idx=this._BINDINGS[ eventName ].length-1; idx>=0; --idx ) {
                var callback = this._BINDINGS[ eventName ][ idx ].callback;
                var callbackParameters = event;

                if( 'function' != typeof callback ) {continue;}

                callbackParameters.data = this._BINDINGS[ eventName ][ idx ].data;

                callback.apply( callbackParameters, callbackArguments );
                }

            }  //  END method trigger()
    });
EventtableObject._internalSequence = 0;



var  DirectoryArray = EventtableObject.extend(
    'DirectoryArray', {
         "data": []
        ,"length": 0
        ,"dataReceived": false

        ,"construct": function() {
            this.data         = [];
            this.length       = 0;
            this.dataReceived = false;
        }

        ,"add": function( items ) {
            if( 'undefined' == typeof items || null == items ) { return; }
            if( !$.isArray(items) ) { items = [ items ]; }

            var numItems = items.length;
            for( var idx = 0; idx < numItems; idx++ ) {
                this.data.push( items[idx] );
                ++this.length;

                var event = { "inserted": [items[idx]] };
                this.trigger('add', event );

                if( 'object' == typeof items[idx] && 'function' == items[idx].on ) {
                    var thisObj = this;
                    items[idx].on(
                        'update', function( itemEvent ) {
                            var eventUpdate = { "updated": [itemEvent.target] };
                            thisObj.trigger( 'update', eventUpdate );
                            });
                    }
                }
            }
        ,"remove": function( idx ) {
            if( 'number' != typeof idx || idx < 0 || idx >= this.data.length ) { return null; }
            var item = this.data.splice(idx,1);
            --this.length;

            var event = { "deleted": [item] };
            this.trigger('remove', event );

            return item;
            }
        ,"get": function( idx ) {
            if( 'number' != typeof idx || idx < 0 || idx >= this.data.length ) { return null; }
            return this.data[idx];
            }

        ,"indexOf": function( valueOrCallback ) {
            var foundIdx = -1;
            if( 'function' == typeof valueOrCallback ) {
                var idx = this.data.length-1;
                while( idx > 0 && !valueOrCallback( this.data[idx] ) ) {
                    --idx;
                    }
                foundIdx = idx;
                }
            return foundIdx;
            }
        ,"forEach": function( callback ) {
            this.data.forEach( callback );
            }
        ,"filter": function( callback ) {
            return this.data.filter( callback );
            }

        ,"isDataReceived": function() { return this.dataReceived; }
        ,"setDataReceived": function( received ) { this.dataReceived = received; }

        ,"isEmpty": function() { return !this.dataReceived || this.data.length<=0; }
        ,"size": function() { return this.data.length; }
/* INHERIT
        ,"on": function() { ... }
        ,"off": function() { ... }
        ,"trigger": function() { ... }
*/
    });


var MomentosApp = {
     "directoriesToSearch": []
     ,"threads": 0
     ,"maxThreads": 0
     ,"cachedFiles": []
     ,"directories": null // [{ name, url, order, coverfile }]
     ,"thumbnailsCache": {}

    ,"init": function() {
        MomentosApp.bindEvents();

        var directoriesDIV = $('.folderList');

        MomentosApp.directories = new DirectoryArray();
        MomentosApp.directories.on(
            'add',
            function(ev) {
                ev.items.inserted.forEach(function(itemDir) {
                    var flexOrder = '';
                    var imageSrc = itemDir.coverFile;

                    if( 'string' == typeof itemDir.order && !isNaN(parseInt(itemDir.order),10) ) { flexOrder = '-webkit-order: '+itemDir.order+'; order: '+itemDir.order+';'; }
                    if( 'undefined' != typeof MomentosApp.thumbnailsCache[imageSrc] ) { imageSrc = 'data:image/jpeg;base64,' + MomentosApp.thumbnailsCache[imageSrc]; }

                    directoriesDIV.append('<div id="folder-'+itemDir.id+'" class="folder" style="'+flexOrder+'"><img id="folderPreview-'+itemDir.id+'" src="'+imageSrc+'"/><div class="title">'+itemDir.name+'</div></div>');

                    if( 'data:' != imageSrc.substr(0,5) ) Caman( '#folderPreview-'+itemDir.id, function() {
                        if( this.height > this.width ) {
                            this.crop( this.width-1, this.width-1, 0, Math.floor( (this.height-this.width)/2 ) );
                            }
                        else if( this.width > this.height ) {
                            this.crop( this.height-1, this.height-1, Math.floor( (this.width-this.height)/2 ), 0 );
                            }

                        this.resize({"width":256}).posterize(16).render();

                        setTimeout(function() {
$('.log').append( 'Saving.' + '<br/>' );
                            var canvas = $( '#folderPreview-'+itemDir.id ).get(0);
                            var base64 = canvas.toDataURL('image/jpeg', 0.8);

                            MomentosApp.thumbnailsCache[itemDir.coverFile] = base64.substr( 1+base64.indexOf(',') );
                            localStorage.setItem( 'thumbnailsCache', JSON.stringify( MomentosApp.thumbnailsCache ) );                            
                            },1000);
                        });
                    });
console.log('Drawing...');
                });

        var aThumbnailsCache = localStorage.getItem( 'thumbnailsCache' );
        if( !aThumbnailsCache ) { aThumbnailsCache = '{}'; }

        MomentosApp.thumbnailsCache = JSON.parse( aThumbnailsCache );

localStorage.setItem( 'directories', '' );
        MomentosApp.directories.add( {"id": "1", "name":"Testing", "url":"", "order":"2", "coverFile": "example.jpg"} );
//        MomentosApp.directories.add( {"id": "2", "name":"Camera",  "url":"file:///storage/emulated/0/DCIM/Camera/", "order":"1", "coverFile": "file:///storage/emulated/0/DCIM/Camera/testingCover.jpg.jpg"} );
//        MomentosApp.directories.add( {"id": "2", "name":"Camera",  "url":"file:///storage/emulated/0/DCIM/Camera/", "order":"1", "coverFile": "angel.jpg"} );
/* */

        var aDirectories = localStorage.getItem( 'directories' );

        if( !aDirectories ) { aDirectories = []; } else { aDirectories = JSON.parse( aDirectories ); }

        MomentosApp.directories.add( aDirectories );
        }

    ,"bindEvents": function() {
        document.addEventListener('deviceready', MomentosApp.deviceReadyListener, false);

        }

    ,"deviceReadyListener": function() {
$('.log').append( 'Fine.' + '<br/>' );

        MomentosApp.searchInSD();
        }  //  END method deviceReadyListener()


/*
dirEntry = { isFile: false,
  isDirectory: true,
  name: 'Camera',
  fullPath: '/DCIM/Camera/',
  filesystem: '<FileSystem: sdcard>',
  nativeURL: 'file:///storage/emulated/0/' }
*/

    ,"searchInSD": function( root ) {

        if( 'undefined' == typeof root ) {

            window.resolveLocalFileSystemURL(
                cordova.file.externalRootDirectory, // + 'Pictures/', //+'DCIM/Camera/',
                function( dirEntry ) {
//                        dirEntry.toURL() => file:///storage/emulated/0/

                    if( dirEntry.isDirectory ) {
                        MomentosApp.searchIntoDirectory( dirEntry );
                        }
                    },
                function() {
console.log( 'Error.' );$('.log').append( 'Error searching root SD.' + '<br/>' );
                    });

setInterval( function() { console.log('Pending: ' + MomentosApp.directoriesToSearch.length + ' threads=' + MomentosApp.threads + ' maxThreads=' + MomentosApp.maxThreads ) }, 5000 );

setTimeout( function() { $('.log').append( 'Saving...' + '<br/>' ); var sDirectories = JSON.stringify( MomentosApp.directories.data ); localStorage.setItem( 'directories', sDirectories ); }, 10000 );

            }
        }  //  END method searchInSD()


    ,"searchIntoDirectory": function( directoryEntry ) {

        if( 'undefined' != typeof directoryEntry ) {
            MomentosApp.directoriesToSearch = [];

            MomentosApp.directoriesToSearch.push( directoryEntry );
            }

        var readDirectoryEntries = function( entries ) {
++MomentosApp.threads;
            var directory = this.directory;
            var lastImageFilename = '';
            var parentName        = directory.toURL();

            for( var idx=0; idx<entries.length; ++idx ) {
                var entry      = entries[idx];
                

                if( entry.isDirectory ) {
                    MomentosApp.processDirectory( entry, parentName );

                    }
                else if( entry.isFile ) {
                    //MomentosApp.processFile( entry, parentName );
                    var imageFilename = MomentosApp.processFile( entry, parentName );
                    if( '' != imageFilename ) { lastImageFilename = imageFilename; }

                    }

                }  // END for entries


console.log( 'Last:' + lastImageFilename );
            if( '' != lastImageFilename ) {
                var directoryObject = null;

                var otherDirs = MomentosApp.directories.filter(function(dir){return dir.url==parentName});
                if( otherDirs.length > 0 ) {
                    directoryObject = otherDirs[0];
                    directoryObject.name += ' *';
                    }
                else {
                    directoryObject = {"id": MomentosApp.directories.length, "name":directory.name, "url":parentName, "order":"", "coverFile": lastImageFilename};
                    MomentosApp.directories.add( directoryObject );
                    }
                }

            
            if( this.isLastThread ) { MomentosApp.searchIntoDirectory(); }
MomentosApp.maxThreads = Math.max( MomentosApp.threads, MomentosApp.maxThreads );
--MomentosApp.threads;

            }  //  END inline-function readDirectoryEntries()


$('.log').append( 'Fine.' + '<br/>' );

        var maxThreads = Math.min(10, MomentosApp.directoriesToSearch.length);


        while( maxThreads > 0 && MomentosApp.directoriesToSearch.length ) {
            --maxThreads;
            var directory = MomentosApp.directoriesToSearch.shift();

            if( directory.isDirectory ) {
console.log( 'Listing: ' + directory.nativeURL );//$('.log').append( 'List: ' + directory.nativeURL + '<br/>' );
                var dirReader         = directory.createReader();

                dirReader.readEntries(
                    readDirectoryEntries.bind( { "directory": directory, "isLastThread": (0==maxThreads) } ),
                    function() {
console.log( 'Error.' );$('.log').append( 'Error.' + '<br/>' );
                        });

                }

            }

        }  //  END method searchIntoDirectory()


    ,"processDirectory": function( entry, parentName ) {
        var filename   = parentName+entry.name;

console.log( '  - ' + filename + ' (is dir)' ); //$('.log').append( '  - ' + filename + ' (is dir)' + '<br/>' );

                                if( 'file:///storage/emulated/0/Android' == filename || '.' == entry.name.substr(0,1) ) {
console.log( '  ---> Ignoring ' + entry.name ); //$('.log').append( '  - ' + filename + ' (is dir)' + '<br/>' );
                                    }
                                else {
                                    MomentosApp.directoriesToSearch.push( entry );
                                    }
        }  //  END method processDirectory()


    ,"processFile": function( entry, parentName ) {
        var filename     = entry.name;
        var fullFilename = parentName+filename;

        var validExtensions = ['jpg','jpeg','png','gif','tiff']

                                if( filename.indexOf('.') > 0 && validExtensions.indexOf( filename.substr(1+filename.lastIndexOf('.')) ) >=0 ) {
console.log( '  - ' + filename + ' (is IMAGE)' ); //$('.log').append( '  - ' + filename + ' (is JPG)' + '<br/>' );
return fullFilename;
                                    }
                                else {
// console.log( '  - ' + filename + ' (is file)' ); //$('.log').append( '  - ' + filename + ' (is file)' + '<br/>' );
                                    }

return '';
        }  //  END method processFile()


    
    };



if( $ ) $(function () {
    MomentosApp.init();
    
    });