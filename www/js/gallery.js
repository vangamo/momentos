function Class() {
  }

Class.clone = function( origin ) {
  var target = origin;

  if( 'number' == typeof origin ) {

    return 1 * origin;
    }

  if( 'string' == typeof origin ) {

    return '' + origin;
    }

  if( 'function' == typeof origin || 'undefined' == typeof origin || null === origin ) {

    return target;
    }

  if( origin instanceof Array ) {
    target = [];
    origin.map( function( item ) {
      target.push( item );
      } );

    return target;
    }

  if( origin instanceof Date ) {
    target = new Date( origin.getTime() );

    return target;
    }

  target = {};
  for( var field in origin ) {
    if( origin[ field ] == origin ) {
      target[ field ] = target;
      continue;
      }

    target[ field ] = Class.clone( origin[ field ] );
    }

  return target;
  };  //  END function Class.clone()



Class.prototype.construct = function() {};



Class.extend = function( nameOrDef, maybeDef ) {
  var name = 'classDef';
  var def = nameOrDef;
  if( 'string' == typeof nameOrDef ) {
    name = nameOrDef;
    def = maybeDef;
    }

  eval( 'var ' + name + ' = function() { if("function" == typeof this.construct && arguments[0] !== Class) { this.construct.apply(this, arguments); } };' );

  var proto = new this( Class );
  var superClass = this.prototype;

  var parentConstructor = this;
  if( 'function' == typeof proto.construct ) {
    parentConstructor = proto.construct;
    }

  proto.__super__ = function() {
    parentConstructor.apply( this, arguments );
    };


  for( var n in def ) {
    var item = def[ n ];
    if( item instanceof Function ) {
      item.$ = superClass;
      }

    proto[ n ] = item;
    }


  eval( name + '.prototype = proto;' );

  //Give this new class the same static extend method
  eval( name + '.extend = this.extend;' );

  return eval( name );
  };  //  END function Class.extend()





var EventtableObject = Class.extend(
  'EventableObject', {
    "_suspendEvents": false
    ,"_VALID_EVENT_NAMES": [ "change" ]

    ,"on": function() {
      // ARGS: event, data?, function
      if( arguments.length < 2 ) {

        return;
        }

      var fullEvent = arguments[ 0 ];
      var callback = arguments[ arguments.length - 1 ];

      var data = {};
      if( 3 == arguments.length ) {
        data = arguments[ 1 ];
        }

      var event = fullEvent;
      if( fullEvent.indexOf( '.' ) > 0 ) {
        event = fullEvent.substr( 0, fullEvent.indexOf( '.' ) );
        }

      event = event.toLowerCase();


      if( 'undefined' == typeof this._BINDINGS ) {
        this._BINDINGS = {};
        }

      if( 'undefined' == typeof this._BINDINGS[ event ] ) {
        this._BINDINGS[ event ] = [];
        }
      else if( 'number' == typeof callback.$ObjectEventableId ) {
        var bindingIdx = this._BINDINGS[ event ].length - 1;
        var found = false;
        while( !found && bindingIdx >= 0 ) {
          found = found || this._BINDINGS[ event ][ bindingIdx ].callback.$ObjectEventableId == callback.$ObjectEventableId;
          ++bindingIdx;
          }

        if( found ) {

          return;
          }

        }

      if( 'number' != typeof callback.$ObjectEventableId ) {
        callback.$ObjectEventableId = EventtableObject._internalSequence++;
        }

      callback.$FullEventName = fullEvent;

      var obj = {
        "data": data
        ,"event": fullEvent
        ,"callback": callback
        };
      this._BINDINGS[ event ].push( obj );

      return callback.$ObjectEventableId;
      }  //  END method EventtableObject.prototype.on()


    ,"off": function() {
      // ARGS: event, callbackId|function

      var callbackId = -1;
      var fullEventName = arguments[ 0 ];
      var eventName = fullEventName;

      if( fullEventName.indexOf( '.' ) > 0 ) {
        eventName = fullEventName.substr( 0, fullEventName.indexOf( '.' ) );
        }
      else {
        if( 'number' == typeof arguments[ 1 ] && !isNaN( parseInt( arguments[ 1 ], 10 ) ) ) {
          callbackId = parseInt( arguments[ 1 ], 10 );
          }

        if( ( 'function' == typeof arguments[ 1 ] || 'object' == typeof arguments[ 1 ] ) && 'number' == typeof arguments[ 1 ].$ObjectEventableId ) {
          callbackId = arguments[ 1 ].$ObjectEventableId;
          }

        if( 0 > callbackId ) {

          return;
          }

        }

      if( 'undefined' === typeof this._BINDINGS[ eventName ] || 0 === this._BINDINGS[ eventName ].length ) {

        return;
        }

      var idx = this._BINDINGS[ eventName ].length - 1;
      while( idx >= 0 ) {
        var callback = this._BINDINGS[ eventName ][ idx ].callback;

        if( fullEventName.indexOf( '.' ) > 0 ) {
          // if namespaced event

          if( callback.$FullEventName == fullEventName ) {
            this._BINDINGS[ eventName ].splice( idx, 1 );
            }

          }
        else {
          // Use callbackId

          if( callback.$ObjectEventableId == callbackId ) {
            this._BINDINGS[ eventName ].splice( idx, 1 );
            }

          }


        --idx;
        }

      }  //  END method EventtableObject.prototype.off()

    ,"trigger": function( eventName, itemsData ) {
      eventName = eventName.toLowerCase();
      if( 'undefined' == typeof this._BINDINGS ) {

        return;
        }

      if( 'undefined' == typeof this._BINDINGS[ eventName ] ) {

        return;
        }

      if( 'object' != typeof itemsData || null === itemsData ) {
        itemsData = {};
        }

      if( this._suspendEvents ) {

        return;
        }

      if( 0 >= this._BINDINGS[ eventName ].length ) {

        return;
        }

      var event = {
        "target": this
        ,"timeStamp": ( new Date() ).getTime()
        ,"items": itemsData
        };

      var callbackArguments = [];
      callbackArguments.push( event );

      for( var idx = this._BINDINGS[ eventName ].length - 1; idx >= 0; --idx ) {
        var callback = this._BINDINGS[ eventName ][ idx ].callback;
        var callbackParameters = event;

        if( 'function' != typeof callback ) {
          continue;
          }

        callbackParameters.data = this._BINDINGS[ eventName ][ idx ].data;

        callback.apply( callbackParameters, callbackArguments );
        }

      }  //  END method EventtableObject.prototype.trigger()
    } );  //  END class EventableObject

EventtableObject._internalSequence = 0;





var DirectoryArray = EventtableObject.extend(
  'DirectoryArray', {
    "data": []
    ,"length": 0
    ,"dataReceived": false



    ,"construct": function() {
      this.data = [];
      this.length = 0;
      this.dataReceived = false;
      }  //  END method DirectoryArray.construct()



    ,"add": function( items ) {
      if( 'undefined' == typeof items || null === items ) {

        return;
        }

      if( !$.isArray( items ) ) {
        items = [ items ];
        }

      var numItems = items.length;
      for( var idx = 0; idx < numItems; idx++ ) {
        this.data.push( items[ idx ] );
        ++this.length;

        var event = {
          "inserted": [ items[ idx ] ]
          };
        this.trigger( 'add', event );

        if( 'object' == typeof items[ idx ] && 'function' == items[ idx ].on ) {
          var thisObj = this;
          items[ idx ].on(
            'update', function( itemEvent ) {
              var eventUpdate = {
                "updated": [ itemEvent.target ]
                };
              thisObj.trigger( 'update', eventUpdate );
              } );
          }

        }

      }  //  END method DirectoryArray.prototype.add()



    ,"remove": function( idx ) {
      if( 'number' != typeof idx || idx < 0 || idx >= this.data.length ) {

        return null;
        }

      var item = this.data.splice( idx, 1 );
      --this.length;

      var event = {
        "deleted": [ item ]
        };
      this.trigger( 'remove', event );

      return item;
      }  //  END method DirectoryArray.prototype.remove()



    ,"get": function( idx ) {
      if( 'number' != typeof idx || idx < 0 || idx >= this.data.length ) {

        return null;
        }

      return this.data[ idx ];
      }  //  END method DirectoryArray.prototype.get()



    ,"indexOf": function( valueOrCallback ) {
      var foundIdx = -1;
      if( 'function' == typeof valueOrCallback ) {
        var idx = this.data.length - 1;
        while( idx > 0 && !valueOrCallback( this.data[ idx ] ) ) {
          --idx;
          }

        foundIdx = idx;
        }

      return foundIdx;
      }  //  END method DirectoryArray.prototype.indexOf()



    ,"forEach": function( callback ) {
      this.data.forEach( callback );
      }  //  END method DirectoryArray.prototype.forEach()



    ,"filter": function( callback ) {

      return this.data.filter( callback );
      }  //  END method DirectoryArray.prototype.filter()



    ,"isDataReceived": function() {

      return this.dataReceived;
      }  //  END method DirectoryArray.prototype.isDataReceived()



    ,"setDataReceived": function( received ) {
      this.dataReceived = received;
      }  //  END method DirectoryArray.prototype.setDataReceived()



    ,"isEmpty": function() {

      return !this.dataReceived || this.data.length <= 0;
      }  //  END method DirectoryArray.prototype.isEmpty()



    ,"size": function() {

      return this.data.length;
      }  //  END method DirectoryArray.prototype.size()



    ,"toJSON": function() {
      var jsonData = [];
      try {
        jsonData = JSON.stringify( this.data );
        } catch ( e ) {
        jsonData = [];
        }

      return jsonData;
      }  //  END method DirectoryArray.prototype.toJSON()


    /* INHERIT
            ,"on": function() { ... }
            ,"off": function() { ... }
            ,"trigger": function() { ... }
    */
    } );  //  END class DirectoryArray










var MomentosApp = {
  "directoriesToSearch": []
  ,"threads": 0
  ,"maxThreads": 0
  ,"cachedFiles": []

  ,"directories": null  // [{ name, url, order, coverfile }]
  ,"files": null
  ,"thumbnails": []
  ,"indexes": {
    "directories-uri": {}
    ,"files-uri": {}
    }
  ,"thumbnailsCache": {}



  ,"init": function() {
    MomentosApp.bindEvents();

    var directoriesDIV = $( '.folderList' );

    MomentosApp.directories = new DirectoryArray();
    MomentosApp.directories.on(
      'add',
      function( ev ) {
        ev.items.inserted.forEach( function( itemDir ) {
          if( 'undefined' !== typeof itemDir.id && 'undefined' !== typeof itemDir.id ) {
            MomentosApp.indexes[ 'directories-uri' ][ itemDir.uri ] = itemDir.id;

            var flexOrder = '';

            if( 'string' == typeof itemDir.order && !isNaN( parseInt( itemDir.order ), 10 ) ) {
              flexOrder = '-webkit-order: ' + itemDir.order + '; order: ' + itemDir.order + ';';
              }

            var directoryContainer = $( '<div id="folder-' + itemDir.id + '" class="folder" style="' + flexOrder + '"></div>' );
            var title = $( '<div class="title">' + itemDir.name + '</div>' );

            directoryContainer.append( title );
            directoriesDIV.append( directoryContainer );


            if( 'undefined' !== typeof MomentosApp.thumbnails[ itemDir.coverFile ] ) {
              var directoryCoverImage = new Image();
              directoryCoverImage.id = 'cover-' + itemDir.id;
              directoryCoverImage.className = 'cover';
              directoryCoverImage.src = MomentosApp.thumbnails[ itemDir.coverFile ];

              directoryContainer.prepend( directoryCoverImage );
              }


            }

          } );  // END if & foreach
        setTimeout( MomentosApp.renderCovers, 0 );
        } );

    MomentosApp.files = new DirectoryArray();
    MomentosApp.files.on(
      'add',
      function( ev ) {
        ev.items.inserted.forEach( function( itemFile ) {
          if( 'undefined' !== typeof itemFile.id && 'undefined' !== typeof itemFile.uri ) {
            MomentosApp.indexes[ 'files-uri' ][ itemFile.uri ] = itemFile.id;
            }

          } );
        } );

    MomentosApp.thumbnails = [];


    var aThumbnailsCache = localStorage.getItem( 'thumbnailsCache' );
    if( !aThumbnailsCache ) {
      aThumbnailsCache = '{}';
      }

    MomentosApp.thumbnailsCache = JSON.parse( aThumbnailsCache );



    // First, thumbs

    var aThumbs = localStorage.getItem( 'thumbnails' );
    if( !aThumbs ) {
      aThumbs = [ null ];
      }
    else {
      try {
        aThumbs = JSON.parse( aThumbs );
        } catch ( e ) {
        aThumbs = [ null ];
        }
      }

    MomentosApp.thumbnails = aThumbs;
    var thumbCount = 0;
    var thumbSize = 0;
    for( var idx = MomentosApp.thumbnails.length - 1; idx >= 0; --idx ) {
      if( MomentosApp.thumbnails[ idx ] ) {
        thumbCount++;
        thumbSize += MomentosApp.thumbnails[ idx ].length;
        }

      }

console.log( 'THUMBS.count=' + thumbCount + '; THUMBS.size=' + Math.floor( thumbSize / 1024 ) + 'kb. ' );
    aThumbs = null;
    /*
            MomentosApp.thumbnails[ 0 ] = '';
            MomentosApp.thumbnails[ 1 ] = 'example.jpg';
    */


    // Second, files

    var aFiles = localStorage.getItem( 'files' );
    if( !aFiles ) {
      aFiles = [ {} ];
      }
    else {
      try {
        aFiles = JSON.parse( aFiles );
        } catch ( e ) {
        aFiles = [ {} ];
        }
      }

    MomentosApp.files.add( aFiles );
    aFiles = null;  //  Free memory
    /*
            MomentosApp.files.add( {} );  // Leave 0 blank.
            MomentosApp.files.add({
                             "id":          1
                            ,"name":       "example.jpg"
                            ,"uri":        "Testing/example.jpg"
                            ,"lastModify":  1229299292
                            ,"size":        100
                            ,"type":       "image/jpg" });
    */

    // At least, directories. It's important the order.

    var aDirectories = localStorage.getItem( 'directories' );
    if( !aDirectories ) {
      aDirectories = [ {} ];
      }
    else {
      try {
        aDirectories = JSON.parse( aDirectories );
        } catch ( e ) {
        aDirectories = [ {} ];
        }
      }

    MomentosApp.directories.add( aDirectories );
    aDirectories = null;  // Free memory
    /*
            MomentosApp.directories.add( {} );  // Leave 0 blank.
            MomentosApp.directories.add({
                             "id":            1
                            ,"name":          "Testing"
                            ,"uri":           "Testing/"
                            ,"order":         "2"
                            ,"coverFile":      1
                            ,"files":         []
                            ,"max-lastModify": 1229299292
                            ,"sum-size":       100 });
    */



    var button = document.createElement( 'button' );
    button.innerHTML = 'Reset';
    button.addEventListener( 'click', function() {

      MomentosApp.directories.data = [ {} ];
      MomentosApp.directories.length = 1;
      MomentosApp.files.data = [ {} ];
      MomentosApp.files.length = 1;
      MomentosApp.thumbnails = [ null, 'example.jpg' ];

      MomentosApp.files.add( {
        "id": 1
        ,"name": "example.jpg"
        ,"uri": "Testing/example.jpg"
        ,"lastModify": 1229299292
        ,"size": 100
        ,"type": "image/jpg"
        } );

      MomentosApp.directories.add( {
        "id": 1
        ,"name": "Testing"
        ,"uri": "Testing/"
        ,"order": "2"
        ,"coverFile": 1
        ,"files": []
        ,"max-lastModify": 1229299292
        ,"sum-size": 100
        } );

      localStorage.setItem( 'directories', MomentosApp.directories.toJSON() );
      localStorage.setItem( 'files', MomentosApp.files.toJSON() );
      localStorage.setItem( 'thumbnails', JSON.stringify( MomentosApp.thumbnails ) );
console.log( 'Reset!' );
      } );
    document.querySelector( '.dir' ).appendChild( button );

    }  //  END method MomentosApp.prototype.init()


  ,"bindEvents": function() {
    document.addEventListener( 'deviceready', MomentosApp.deviceReadyListener, false );

    }  //  END method MomentosApp.prototype.bindEvents()


  ,"deviceReadyListener": function() {

    MomentosApp.searchInSD();
    }  //  END method MomentosApp.prototype.deviceReadyListener()


  /*
  dirEntry = { isFile: false,
    isDirectory: true,
    name: 'Camera',
    fullPath: '/DCIM/Camera/',
    filesystem: '<FileSystem: sdcard>',
    nativeURL: 'file:///storage/emulated/0/' }
  */

  ,"searchInSD": function( root ) {

    if( !cordova || !cordova.file ) {
console.log( 'This is not Cordova environment.' );

      return;
      }

    if( 'undefined' == typeof root ) {

      window.resolveLocalFileSystemURL(
        cordova.file.externalRootDirectory,  // + 'Pictures/', //+'DCIM/Camera/',
        function( dirEntry ) {
          //                        dirEntry.toURL() => file:///storage/emulated/0/

          if( dirEntry.isDirectory ) {
            MomentosApp.searchIntoDirectory( dirEntry );
            }

          },
        function() {
console.log( 'Error.' );$( '.log' ).append( 'Error searching root SD.' + '<br/>' );
          } );

      setInterval( function() {
console.log( 'Pending: ' + MomentosApp.directoriesToSearch.length + ' threads=' + MomentosApp.threads + ' maxThreads=' + MomentosApp.maxThreads );
        }, 5000 );

      //setTimeout( function() { $('.log').append( 'Saving...' + '<br/>' ); var sDirectories = JSON.stringify( MomentosApp.directories.data ); localStorage.setItem( 'directories', sDirectories ); }, 10000 );

      }

    }  //  END method MomentosApp.prototype.searchInSD()


  ,"searchIntoDirectory": function( directoryEntry ) {

    if( 'undefined' != typeof directoryEntry ) {
      MomentosApp.directoriesToSearch = [];

      MomentosApp.directoriesToSearch.push( directoryEntry );
      $( '.log' ).append( 'Fine.' + '<br/>' );
      }

    var readDirectoryEntries = function( entries ) {
      ++MomentosApp.threads;
      var directory = this.directory;
      var directoryName = directory.toURL();
      var directoryImages = [];
      var lastTimestamp = 0;
      var lastTimestampFile = 0;
      var sumSize = 0;


      for( var idx = 0; idx < entries.length; ++idx ) {
        var entry = entries[ idx ];

        if( entry.isDirectory ) {
          MomentosApp.processDirectory( entry, directoryName );

          }
        else if( entry.isFile ) {
          var imageId = MomentosApp.processFile( entry, directoryName );

          if( 0 < imageId ) {
            // entry is an image file

            var imageTimestamp = entry.lastModified ? entry.lastModified : 0;
            if( 0 === lastTimestamp || lastTimestamp <= imageTimestamp ) {
              lastTimestamp = imageTimestamp;
              lastTimestampFile = imageId;
              }

            sumSize += entry.size ? entry.size : 0;
            directoryImages.push( imageId );
            }

          }

        }  // END for entries


      if( 0 < directoryImages.length ) {
        // directoryEntry has images

        var directoryObject = {
          "id": MomentosApp.directories.length
          ,"name": directory.name
          ,"uri": directoryName
          ,"order": ""
          ,"coverFile": lastTimestampFile
          ,"files": directoryImages
          ,"max-lastModify": lastTimestamp
          ,"sum-size": sumSize
          };
        var directoryIndex = MomentosApp.indexes[ 'directories-uri' ][ directoryObject.uri ];
        if( 'undefined' !== typeof directoryIndex ) {
          // UPDATE

          var savedDirectory = MomentosApp.directories.get( directoryIndex );
          savedDirectory.coverFile = directoryObject.coverFile;
          savedDirectory.files = directoryObject.files;
          savedDirectory[ 'max-lastModify' ] = directoryObject[ 'max-lastModify' ];
          savedDirectory[ 'sum-size' ] = directoryObject[ 'sum-size' ];
          }
        else {
          // INSERT
console.log( 'Saving ' + directory.name );

          MomentosApp.directories.add( directoryObject );
          }

        }


      if( this.isLastThread ) {
        MomentosApp.searchIntoDirectory();
        }

      MomentosApp.maxThreads = Math.max( MomentosApp.threads, MomentosApp.maxThreads );
      --MomentosApp.threads;

      };  //  END inline-function readDirectoryEntries()




    if( 0 === MomentosApp.directoriesToSearch.length ) {
console.log( 'END' );

      localStorage.setItem( 'directories', MomentosApp.directories.toJSON() );
      localStorage.setItem( 'files', MomentosApp.files.toJSON() );

      setTimeout( MomentosApp.renderCovers, 0 );

      /*
      $('.log').append( 'DIRECTORIES: ' + JSON.stringify( MomentosApp.directories ) + '<br/><br/>' );
      $('.log').append( 'IDX: ' + JSON.stringify( MomentosApp.indexes ) + '<br/><br/>' );
      $('.log').append( 'FILES: ' + JSON.stringify( MomentosApp.files ) + '<br/>' );
      */
      }

    var maxThreads = Math.min( 10, MomentosApp.directoriesToSearch.length );


    while( maxThreads > 0 && MomentosApp.directoriesToSearch.length ) {
      --maxThreads;
      var directory = MomentosApp.directoriesToSearch.shift();

      if( directory.isDirectory ) {
        var dirReader = directory.createReader();

        dirReader.readEntries(
          readDirectoryEntries.bind( {
            "directory": directory,"isLastThread": ( 0 === maxThreads )
            } ),
          function() {
console.log( 'Error.' );$( '.log' ).append( 'Error.' + '<br/>' );
            } );

        }

      }

    }  //  END method MomentosApp.prototype.searchIntoDirectory()


  ,"processDirectory": function( entry, parentName ) {
    var filename = parentName + entry.name;

    if( 'file:///storage/emulated/0/Android' == filename || '.' == entry.name.substr( 0, 1 ) ) {
      }
    else {
      MomentosApp.directoriesToSearch.push( entry );
      }

    }  //  END method MomentosApp.prototype.processDirectory()


  ,"processFile": function( entry, parentName ) {
    var filename = entry.name;
    var fullFilename = parentName + filename;

    var validExtensions = [ 'jpg', 'jpeg', 'png', 'gif', 'tiff' ];

    if( filename.indexOf( '.' ) > 0 && validExtensions.indexOf( filename.substr( 1 + filename.lastIndexOf( '.' ) ) ) >= 0 ) {

      var imageFileId = MomentosApp.files.length;
      var imageFileObj = {
        "id": imageFileId
        ,"name": entry.name
        ,"uri": entry.toURL()
        ,"lastModify": entry.lastModified ? entry.lastModified : 0
        ,"size": entry.size ? entry.size : 0
        ,"type": entry.type ? entry.type : 0
        };

      var fileIndex = MomentosApp.indexes[ 'files-uri' ][ imageFileObj.uri ];

      if( 'undefined' !== typeof fileIndex ) {
        // UPDATE

        var savedFile = MomentosApp.files.get( fileIndex );
        savedFile.lastModify = imageFileObj.lastModify;
        savedFile.size = imageFileObj.size;

        imageFileId = savedFile.id;
        }
      else {
        MomentosApp.files.add( imageFileObj );
        MomentosApp.indexes[ 'files-uri' ][ imageFileObj.uri ] = imageFileId;
        }

      return imageFileId;
      }
    else {
      // console.log( '  - ' + filename + ' (is file)' ); //$('.log').append( '  - ' + filename + ' (is file)' + '<br/>' );
      }

    return 0;
    }  //  END method MomentosApp.prototype.processFile()



  ,"renderCovers": function( folderIndex ) {

    if( 'undefined' === typeof folderIndex ) {
      folderIndex = 0;
      }

    var elements = document.querySelectorAll( '.folder' );

    if( elements.length <= folderIndex ) {

      return;
      }

    var currentElement = elements.item( folderIndex );

    if( null !== currentElement.querySelector( 'img' ) || null !== currentElement.querySelector( 'canvas' ) ) {
      setTimeout( MomentosApp.renderCovers, 0, ( 1 + folderIndex ) );

      return;
      }

    var folderId = currentElement.id.substr( 1 + currentElement.id.lastIndexOf( '-' ) );
    folderId *= 1;
    var image = new Image();
    image.id = 'cover-' + folderId;
    image.className = 'cover';

    image.addEventListener( 'load', function() {
      var canvas = null;
      var ctx = null;

      var imageWidth = image.naturalWidth;
      var imageHeight = image.naturalHeight;

      if( imageWidth / imageHeight - 1 > 0.1 ) {
        // Crop

        var newSize = imageWidth;
        var newX,
          newY = 0;
        if( imageWidth > imageHeight ) {
          newSize = image.naturalHeight;
          newX = 0 + Math.floor( ( imageWidth - newSize ) / 2 );
          newY = 0;
          }
        else {
          newSize = imageWidth;
          newX = 0;
          newY = 0 + Math.floor( ( imageHeight - newSize ) / 2 );
          }

console.log( 'Must crop: ' + imageWidth + 'x' + imageHeight + ' -> ' + newSize + 'x' + newSize + '(+' + newX + '+' + newY + ')' );

        var transfCanvas = document.createElement( 'canvas' );
        transfCanvas.width = newSize;
        transfCanvas.height = newSize;
        ctx = transfCanvas.getContext( '2d' );

        ctx.drawImage( image, newX, newY, newSize, newSize, 0, 0, newSize, newSize );

        canvas = transfCanvas;
        imageWidth = newSize;
        imageHeight = newSize;
        }

      if( Math.min( document.querySelector( '.folderList' ).clientWidth, 150 ) < imageWidth || Math.min( document.querySelector( '.folderList' ).clientWidth, 150 ) < imageHeight ) {
        // Resize

        var newWidth = 150;
        var newHeight = 150;
console.log( 'Must resize: ' + imageWidth + 'x' + imageHeight + ' --> ' + newWidth + 'x' + newHeight );

        var transfCanvas = document.createElement( 'canvas' );
        transfCanvas.width = newWidth;
        transfCanvas.height = newHeight;
        ctx = transfCanvas.getContext( '2d' );

        ctx.drawImage( canvas, 0, 0, newWidth, newHeight );

        canvas = transfCanvas;
        imageWidth = newWidth;
        imageHeight = newHeight;
        }


      if( !canvas ) {
        setTimeout( MomentosApp.renderCovers, 0, ( 1 + folderIndex ) );

        return;
        }
      else {
        var thumbnailImage_base64 = canvas.toDataURL( 'image/jpeg', 0.8 );

        var newImage = new Image();
        newImage.addEventListener( 'load', function() {
console.log( 'Size changed.' ); setTimeout( MomentosApp.renderCovers, 0, ( 1 + folderIndex ) );

          return;
          } );
        newImage.id = 'cover-' + folderId;
        newImage.className = 'cover';
        newImage.src = thumbnailImage_base64;

        image.parentNode.replaceChild( newImage, image );
        image = null;  // Free memory

        if( thumbnailImage_base64.length <= 10 * 1024 ) {
          var directoryData = MomentosApp.directories.get( folderId );

          MomentosApp.thumbnails[ directoryData.coverFile ] = thumbnailImage_base64;
          thumbnailImage_base64 = null;  // Free memory
          localStorage.setItem( 'thumbnails', JSON.stringify( MomentosApp.thumbnails ) );
          var thumbCount = 0;
          var thumbSize = 0;
          for( var idx = MomentosApp.thumbnails.length - 1; idx >= 0; --idx ) {
            if( MomentosApp.thumbnails[ idx ] ) {
              thumbCount++;
              thumbSize += MomentosApp.thumbnails[ idx ].length;
              }

            }

console.log( 'THUMBS.count=' + thumbCount + '; THUMBS.size=' + Math.floor( thumbSize / 1024 ) + 'kb. ' );
          }

        }

      return;
      } );
    image.addEventListener( 'error', function() {
      setTimeout( MomentosApp.renderCovers, 0, ( 1 + folderIndex ) );

      return;
      } );
console.log( 'SRC = ' + MomentosApp.files.get( MomentosApp.directories.get( 1 * folderId ).coverFile.uri ) );
    image.src = MomentosApp.files.get( MomentosApp.directories.get( 1 * folderId ).coverFile.uri );

    currentElement.appendChild( image );

    //setTimeout( MomentosApp.renderCovers, 0 );
    }  //  END method MomentosApp.prototype.renderCovers()

  };  //  END class MomentosApp





if( $ ) {
  $( function() {
    MomentosApp.init();

    } );
  }