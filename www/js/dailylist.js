function Class() {  }
Class.clone = function( origin ) {
  var target = origin;

  if( 'number' === typeof origin ) {
    return 1 * origin;
    }
  if( 'string' === typeof origin ) {
    return '' + origin;
    }
  if( 'function' === typeof origin || 'undefined' === typeof origin || null === origin ) {
    return target;
    }

  if( origin instanceof Array ) {
    target = [  ];
    origin.map( function( item ) {
      target.push( item );
      } );
    return target;
    }

  if( origin instanceof Date ) {
    target = new Date( origin.getTime() );
    return target;
    }

  target = {  };
  for( var field in origin ) {
    if( origin[ field ] == origin ) {
      target[ field ] = target;
      continue;
      }
    target[ field ] = Class.clone( origin[ field ] );
    }
  return target;
  };

Class.prototype.construct = function() {  };
Class.extend = function( nameOrDef, maybeDef ) {
  var name = 'classDef';
  var def = nameOrDef;
  if( 'string' === typeof nameOrDef ) {
    name = nameOrDef;
    def = maybeDef;
    }
  eval( 'var ' + name + ' = function() { if("function" == typeof this.construct && arguments[0] !== Class) { this.construct.apply(this, arguments);   }   };' );


  var proto = new this( Class );
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


      for(var m in proto) {
          if( 'function' === typeof proto[m] ) {
              proto.__parent__[m] = proto[m];
                }
            }
  */
  var parentConstructor = this;
  if( 'function' === typeof proto.construct ) {
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
  };

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

        var data = {  };
        if( 3 == arguments.length ) {
          data = arguments[ 1 ];
          }

        var event = fullEvent;
        if( fullEvent.indexOf( '.' ) > 0 ) {
          event = fullEvent.substr( 0, fullEvent.indexOf( '.' ) );
          }
        event = event.toLowerCase();


        if( 'undefined' === typeof this._BINDINGS ) {
          this._BINDINGS = {  };
          }
        if( 'undefined' === typeof this._BINDINGS[ event ] ) {
          this._BINDINGS[ event ] = [];
          }
        else if( 'number' === typeof callback.$ObjectEventableId ) {
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

        if( 'number' !== typeof callback.$ObjectEventableId ) {
          callback.$ObjectEventableId = EventtableObject._internalSequence++;
          }
        callback.$FullEventName = fullEvent;

        var obj = {
          'data': data
          , 'event': fullEvent
          , 'callback': callback
          };
        this._BINDINGS[ event ].push( obj );

        return callback.$ObjectEventableId;
        } //  END method on()


    ,"off": function() {
        // ARGS: event, callbackId|function

        var callbackId = -1;
        var fullEventName = arguments[ 0 ];
        var eventName = fullEventName;

        if( fullEventName.indexOf( '.' ) > 0 ) {
          eventName = fullEventName.substr( 0, fullEventName.indexOf( '.' ) );
          }
        else {
          if( 'number' === typeof arguments[ 1 ] && !isNaN( parseInt( arguments[ 1 ], 10 ) ) ) {
            callbackId = parseInt( arguments[ 1 ], 10 );
            }
          if( ( 'function' === typeof arguments[ 1 ] || 'object' === typeof arguments[ 1 ] ) && 'number' === typeof arguments[ 1 ].$ObjectEventableId ) {
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
        } //  END method off()

    ,"trigger": function( eventName, itemsData ) {
        eventName = eventName.toLowerCase();
        if( 'undefined' === typeof this._BINDINGS ) {
          return;
          }
        if( 'undefined' === typeof this._BINDINGS[ eventName ] ) {
          return;
          }

        if( 'object' !== typeof itemsData || null === itemsData ) {
          itemsData = {  };
          }

        if( this._suspendEvents ) {
          return;
          }
        if( 0 >= this._BINDINGS[ eventName ].length ) {
          return;
          }

        var event = {
          "target": this
          ,"timeStamp": ( new Date() )
            .getTime()
          ,"items": itemsData
          };

        var callbackArguments = [];
        callbackArguments.push( event );

        for( var idx = this._BINDINGS[ eventName ].length - 1; idx >= 0; --idx ) {
          var callback = this._BINDINGS[ eventName ][ idx ].callback;
          var callbackParameters = event;

          if( 'function' !== typeof callback ) {
            continue;
            }

          callbackParameters.data = this._BINDINGS[ eventName ][ idx ].data;

          callback.apply( callbackParameters, callbackArguments );
          }

        } //  END method trigger()
    } );
EventtableObject._internalSequence = 0;





var Note = EventtableObject.extend(
  'Note', {
     "id": null
    ,"type": "task"
    ,"app": "DailyListBeta"
    ,"title": ""
    ,"time": ""
      //  ,"status"
      //  ,"modifier"
    ,"lists": []
      //  ,"periodicity"

    ,"dirty": false

    ,"construct": function( values ) {
      for( var field in values ) {
        if( 'undefined' !== typeof this[ field ] ) {
          this[ field ] = values[ field ];
          }
        }

      }
    ,"getBullet": function() {
        return '?';
        }
      /* INHERIT
      		,"on": function() { ...   }
      		,"off": function() { ...   }
      		,"trigger": function() { ...   }
      */
    } );
Note.create = function( values ) {
  var returnObj = null;
  var idx = 0;
  while( idx < Note.IDENTIFY_FUNCTIONS.length && null === returnObj ) {
    returnObj = Note.IDENTIFY_FUNCTIONS[ idx ]( values );
    ++idx;
    }
  if( null !== returnObj ) {
    return returnObj;
    }

  return new Note( values );
  };

Note.TYPES = {  };
Note.TYPE_NAMES = [];
Note.IDENTIFY_FUNCTIONS = [];
Note._TYPE_ORDER = [];
Note.registerNoteType = function( name, typeClass, bullet, identifyFunction, order ) {
  if( 0 > Note.TYPE_NAMES.indexOf( name ) ) {
    typeClass.BULLET = bullet;
    Note.TYPES[ name ] = typeClass;

    var idx = Note._TYPE_ORDER.length - 1;
    if( 'number' !== typeof order ) {
      if( 0 === Note._TYPE_ORDER.length ) {
        order = 10;
        }
      else {
        order = Note._TYPE_ORDER[ Note._TYPE_ORDER.length - 1 ] + 10;
        }
      }
    else {
      while( idx >= 0 && Note._TYPE_ORDER[ idx ] > order ) {
        idx--;
        }
      }
    Note._TYPE_ORDER.splice( 1 + idx, 0, order );
    Note.TYPE_NAMES.splice( 1 + idx, 0, name );
    Note.IDENTIFY_FUNCTIONS.splice( 1 + idx, 0, identifyFunction );
    }
  };





var Event = Note.extend(
  'Event', {
    "status": ""
    ,"periodicity": ""

    ,"construct": function( values ) {
      this.__super__.call( this, values );

      if( 'undefined' !== typeof values.status ) {
        this.status = values.status;
        }
      if( 'undefined' !== typeof values.periodicity ) {
        this.periodicity = values.periodicity;
        }
      }

    ,"getBullet": function() {
      return Event.BULLET;
      }
    ,"renderEditPage": function( toolbarDom, editingDom ) {
      toolbarDom
        .prepend( $( '<div class="button" name="done"></div>' )
          .on(
            'click'
            , function() {
              editingDom.find( '.bulletList .bulletIcon[class~="selected"]' )
                .detach();
              } ) )
        .prepend( $( '<div class="button" name="fastForward"></div>' )
          .on(
            'click'
            , function() {
              editingDom
                .append( '<div>Pospuesta al próximo lunes.</div>' );

              } ) );
      }
    } );
Event.BULLET = '&#x25CB;';
Note.registerNoteType(
  'Event', Event
  , Event.BULLET
  , function( values ) {
    if( 'event' == values.type ) {
      return new Event( values );
      }
    return null;
    }
  , 10 );


var Task = Note.extend(
  'Task', {
    "status": ""
    ,"modifier": ""
    ,"periodicity": ""

    ,"construct": function( values ) {
      this.__super__.call( this, values );

      if( 'undefined' !== typeof values.status ) {
        this.status = values.status;
        }
      if( 'undefined' !== typeof values.modifier ) {
        this.modifier = values.modifier;
        }
      if( 'undefined' !== typeof values.periodicity ) {
        this.periodicity = values.periodicity;
        }
      }

    ,"getBullet": function() {
      return Task.BULLET;
      }
    } );
Task.BULLET = '&#x2022;';
Note.registerNoteType(
  'Task', Task
  , Task.BULLET
  , function( values ) {
    if( 'task' == values.type ) {
      return new Task( values );
      }
    return null;
    }
  , 20 );


var Thought = Note.extend(
  'Thought', {
    "modifier": ""

    ,"construct": function( values ) {
      this.__super__.call( this, values );

      if( 'undefined' !== typeof values.modifier ) {
        this.modifier = values.modifier;
        }
      }

    ,"getBullet": function() {
      return Thought.BULLET;
      }
    } );
Thought.BULLET = '&#x002D;';
Note.registerNoteType(
  'Thought', Thought
  , Thought.BULLET
  , function( values ) {
    if( 'thought' == values.type ) {
      return new Thought( values );
      }
    return null;
    }
  , 30 );


var Spending = Note.extend(
  'Spending', {
    "status": ""
    ,"periodicity": ""

    ,"construct": function( values ) {
      this.__super__.call( this, values );

      if( 'undefined' !== typeof values.status ) {
        this.status = values.status;
        }
      if( 'undefined' !== typeof values.periodicity ) {
        this.periodicity = values.periodicity;
        }
      }

    ,"getBullet": function() {
      return Spending.BULLET;
      }
    } );
Spending.BULLET = '$';
Note.registerNoteType(
  'Spending', Spending
  , Spending.BULLET
  , function( values ) {
    if( 'spending' == values.type ) {
      return new Spending( values );
      }
    return null;
    }
  , 40 );




var Provider = {
  "queryCache": [] //  [ { "cond": func(),"array": NoteArray,"accessTime": 1440000000,"refreshTime": 14400000   }, { ..   }, ... ]

  ,"create": function( values ) {
    var aItems = JSON.parse( localStorage.getItem( "itemsList" ) );
    if( null === aItems ) {
      aItems = [];
      }

    var lastIdx = aItems.length;
    aItems.forEach( function( elem ) {
      if( 'number' === typeof elem.id && elem.id > lastIdx ) {
        lastIdx = elem.id;
        }
      } );

    values.id = ++lastIdx;
    aItems.push( values );

    localStorage.setItem( "itemsList", JSON.stringify( aItems ) );

    this.queryCache.forEach( function( itemCache ) {
      if( itemCache.conds( values ) ) {
        itemCache.array.add( Note.create( values ) );
        }
      } );
    }

  ,"delete": function( itemId ) {
    var aItems = JSON.parse( localStorage.getItem( "itemsList" ) );
    var idx = aItems.length - 1;
    while( idx >= 0 && 'undefined' != aItems[ idx ].id && itemId != aItems[ idx ].id ) {
      --idx;
      }

    var values = null;
    if( idx >= 0 ) {
      values = aItems.splice( idx, 1 );
      }

    if( null !== values ) {
      localStorage.setItem( "itemsList", JSON.stringify( aItems ) );

      this.queryCache.forEach( function( itemCache ) {
        if( itemCache.conds( values ) ) {
          var idx = itemCache.array.indexOf( function( itemValues ) {
            return ( itemValues.id == values.itemId );
            } );
          itemCache.array.remove( idx );
          }
        } );
      }
    }

  ,"update": function( itemId, values ) {
    var aItems = JSON.parse( localStorage.getItem( "itemsList" ) );
    var idx = aItems.length - 1;
    while( idx >= 0 && 'undefined' != aItems[ idx ].id && itemId != aItems[ idx ].id ) {
      --idx;
      }

    if( idx >= 0 ) {
      var item = aItems[ idx ];
      var dirty = false;
      for( var fieldName in values ) {
        if( 'undefined' === typeof item[ fieldName ] || item[ fieldName ] != values[ fieldName ] ) {
          item[ fieldName ] = values[ fieldName ];
          dirty = true;
          }
        }
      if( dirty ) {
        aItems[ idx ] = item;
        }
      }

    localStorage.setItem( "itemsList", JSON.stringify( aItems ) );
    }

  ,"read": function( conds, list ) {
    var aItems = JSON.parse( localStorage.getItem( "itemsList" ) );
    if( null === aItems ) {
      aItems = [];
      }

    var itemsMatched = [];
    for( idx = aItems.length - 1; idx >= 0; --idx ) {
      if( 'function' === typeof conds ) {
        if( conds( aItems[ idx ] ) ) {
          itemsMatched.push( Note.create( aItems[ idx ] ) );
          }
        }
      else if( 'undefined' !== typeof aItems[ idx ].time && !isNaN( parseInt( aItems[ idx ].time, 10 ) ) && parseInt( aItems[ idx ].time, 10 ) >= conds && parseInt( aItems[ idx ].time, 10 ) < ( conds + 86400000 ) ) {
        itemsMatched.push( Note.create( aItems[ idx ] ) );
        }
      }

    itemsMatched.reverse();

    if( 'undefined' === typeof list || null === list || 'function' !== typeof list.add ) {
      return itemsMatched;
      }
    list.add( itemsMatched );
    list.setDataReceived( true );
    this.queryCache.push( {
      "conds": conds
      ,"array": list
      ,"accessTime": new Date()
        .getTime()
      ,"refreshTime": new Date()
        .getTime()
      } );
    }

  ,"get": function( id ) {
    var aItems = JSON.parse( localStorage.getItem( "itemsList" ) );
    if( null === aItems ) {
      aItems = [];
      }

    var itemMatched = null;
    var idx = aItems.length - 1;
    while( null === itemMatched && idx >= 0 ) {
      if( 'undefined' !== typeof aItems[ idx ].id && id == aItems[ idx ].id ) {
        itemMatched = Note.create( aItems[ idx ] );
        }
      --idx;
      }

    return itemMatched;
    }

  ,"getLists": function() {
    var aItems = JSON.parse( localStorage.getItem( "itemsList" ) );
    if( null === aItems ) {
      aItems = [];
      }

    var itemsMatched = [];
    for( idx = aItems.length - 1; idx >= 0; --idx ) {
      if( 'undefined' !== typeof aItems[ idx ].lists && 'number' === typeof aItems[ idx ].lists.length ) {
        itemsMatched = itemsMatched.concat( aItems[ idx ].lists );
        }
      }

    itemsMatched = itemsMatched.filter(
      function( item, pos, self ) {
        return pos === self.indexOf( item );
        } );

    return itemsMatched;

    }


  ,"count": function( values ) {
    var aItems = JSON.parse( localStorage.getItem( "itemsList" ) );
    if( null === aItems ) {
      aItems = [];
      }

    return aItems.length;
    }
  };


var NoteArray = EventtableObject.extend(
  'NoteArray', {
    "data": []
    ,"length": 0
    ,"dataReceived": false

    ,"construct": function() {
      this.data = [];
      this.length = 0;
      this.dataReceived = false;
      }

    ,"add": function( items ) {
      if( 'undefined' === typeof items || null === items ) {
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

        if( 'object' === typeof items[ idx ] && 'function' == items[ idx ].on ) {
          var thisObj = this;
          items[ idx ].on(
            'update'
            , function( itemEvent ) {
              var eventUpdate = {
                "updated": [ itemEvent.target ]
                };
              thisObj.trigger( 'update', eventUpdate );
              } );
          }
        }
      }
    ,"remove": function( idx ) {
      if( 'number' !== typeof idx || idx < 0 || idx >= this.data.length ) {
        return null;
        }
      var item = this.data.splice( idx, 1 );
      --this.length;

      var event = {
        "deleted": [ item ]
        };
      this.trigger( 'remove', event );

      return item;
      }
    ,"get": function( idx ) {
      if( 'number' !== typeof idx || idx < 0 || idx >= this.data.length ) {
        return null;
        }
      return this.data[ idx ];
      }

    ,"indexOf": function( valueOrCallback ) {
      var foundIdx = -1;
      if( 'function' === typeof valueOrCallback ) {
        var idx = this.data.length - 1;
        while( idx > 0 && !valueOrCallback( this.data[ idx ] ) ) {
          --idx;
          }
        foundIdx = idx;
        }
      return foundIdx;
      }
    ,"forEach": function( callback ) {
      this.data.forEach( callback );
      }

    ,"isDataReceived": function() {
      return this.dataReceived;
      }
    ,"setDataReceived": function( received ) {
      this.dataReceived = received;
      }

    ,"isEmpty": function() {
      return !this.dataReceived || this.data.length <= 0;
      }
    ,"size": function() {
        return this.data.length;
        }
      /* INHERIT
      		,"on": function() { ...   }
      		,"off": function() { ...   }
      		,"trigger": function() { ...   }
      */
    } );





var NoteList = EventtableObject.extend(
  'NoteList', {
    "id": ""
    ,"data": {  }
    ,"dom": $()
    ,"mapping": {  }
    //		,"state":   "loading"    //  "loading" | "empty" | "listed"

    ,"template": {
      "root": "<div id=\"##ID##\" class=\"list currentDayList\"><div class=\"itemList day\">##DATE_DISPLAYED_SHORT##</div>  <!-- .itemList .day -->##LIST##</div> <!-- END .list ###ID## -->"
      ,"id": "list-##DATE_RAW##"
      ,"item": "<div id=\"item-##ID##\" class=\"itemList item\">" +
        "    <div class=\"bullet\">&nbsp;</div>" +
        "    <div class=\"bullet\" name=\"##TYPE##\">##BULLET##</div>" +
        "    <div class=\"title\">##TITLE##</div>" +
        "</div>  <!-- .itemList .item #item-##ID## -->"
      ,"loading": "##Listing.Loading notes##"
      ,"empty": ""
      }


    ,"construct": function( dataArray, domParent ) {
console.log( 'Show ' + this.id );
        if( '' === this.id ) {
          this.id = 'date-' + Date.today()
            .getTime();
          } // Timestamp

        if( 0 < $( '#' + this.id )
          .length ) {
          this.dom = $( '#' + this.id );
          }
        else {
          this._createDomElement( domParent );
          }

        this.dom.css( {
          "transform-origin": "0% 0% 0px"
          ,"transform": "rotateY(0deg) skewY(0deg)"
          } );

        var thisObj = this;
        var contentDiv = this.dom.find( '.listContent' );
        var state = contentDiv.attr( 'class' )
          .replace( /listContent/g, '' )
          .trim();

        this.data = dataArray;

        if( 'object' === typeof this.data && 'function' === typeof this.data.isDataReceived ) {
          this.data.on( 'add', function( ev ) {
            thisObj.dataCreateListener( ev );
            } );
          this.data.on( 'remove', function( ev ) {
            thisObj.dataDeleteListener( ev );
            } );
          this.data.on( 'change', function( ev ) {
            thisObj.dataUpdateListener( ev );
            } );

          if( this.data.isDataReceived() ) {
            if( !this.data.isEmpty() ) {

              setTimeout(
                function() {
                  thisObj.data.forEach( function( item ) {
                    thisObj.dataCreateListener( {
                      "items": {
                        "inserted": [ item ]
                        }
                      } );
                    } );
                  }, 50 );
              }
            else {

              if( 0 <= [ "loading","emtpy" ].indexOf( state ) ) {
                contentDiv.replaceWith( '<div class="listContent empty">' + this.template.empty + '</div>' );
                }
              }

            }
          }
        else if( $.isArray( this.data ) ) {
          if( 0 < this.data.length ) {

            setTimeout(
              function() {
                thisObj.data.forEach( function( item ) {
                  thisObj.dataCreateListener( {
                    "items": {
                      "inserted": [ item ]
                      }
                    } );
                  } );
                }, 50 );

            }
          else {

            if( 0 <= [ "loading","emtpy" ].indexOf( state ) ) {
              contentDiv.replaceWith( '<div class="listContent empty">' + this.template.empty + '</div>' );
              }
            }
          }

        this.adjustBackground();
        this.resizerTimeout = null;
        $( window )
          .on( 'resize', function() {
            clearTimeout( thisObj.resizerTimeout );
            thisObj.resizerTimeout = setTimeout( function() {
              thisObj.adjustBackground();
              }, 100 );
            } );
        }  //  END NoteList.construct()
/* INHERIT
	  ,"on":      function() { ...   }
		,"off":     function() { ...   }
		,"trigger": function() { ...   }
*/
    ,"updateTitle": function() {
        var templateDay = DailyListApp.DiaryView.templates.itemDay;
        templateDay = templateDay.replace( /##DAY##/g, '<sub>' + today.toString( 'ddd' )
          .substr( 0, 1 )
          .toUpperCase() + '</sub>' + today.toString( 'dd/MM' ) );
        pageDOM.append( templateDay );
        $( '.header' )
          .text( "- " + today.toString( 'MMM' )
            .substr( 0, 1 )
            .toUpperCase() + today.toString( 'MMM' )
            .substr( 1 )
            .toLowerCase() + '. ' + today.toString( 'yyyy' ) + ' -' );
        var newTitle = '';

        DailyListApp.updateTitle( 'list' );
        }  //  END method NoteList.updateTitle()

    ,"show": function( animation ) {
      this.updateTitle();
      if( 0 < this.dom.siblings( '.currentDayList' )
        .length ) {
        if( 'increase' == animation ) {
          transformValue = 'rotateY(-90deg) skewY(-3deg)';
          transformDom = this.dom.siblings( '.currentDayList' );
          }
        else if( 'decrease' == animation ) {
          transformValue = 'rotateY(0deg) skewY(0deg)';
          transformDom = this.dom;
          this.dom.removeClass( 'list' )
            .css( 'transform', 'rotateY(-90deg) skewY(-3deg)' )
            .show()
            .addClass( 'list' );
          }
        else {
          transformValue = '';
          transformDom = $();
          }

        transformDom.css( {
          "transform-origin": "0% 0% 0px"
          ,"transform": transformValue
          ,"position": "fixed"
          ,"top": "0px"
          ,"z-index": "4"
          ,"background": "#EEECE2"
          ,"border-right": "2px solid #555"
          ,"border-bottom": "2px solid #333"
          ,"box-shadow": "90px -90px 180px #A5A0A0"
          } );
        transformDom.prepend( $( '.header' )
          .clone() );

        var domObj = this.dom;
        setTimeout( function() {
          transformDom.find( '.header' )
            .detach();
          transformDom.css( {
            "transform-origin": "0% 0% 0px"
            ,"transform": "rotateY(0deg) skewY(0deg)"
            ,"position": ""
            ,"top": ""
            ,"z-index": ""
            ,"background": "transparent"
            ,"border-right": ""
            ,"border-bottom": ""
            ,"box-shadow": ""
            } );
          domObj.siblings( '.currentDayList' )
            .hide()
            .removeClass( 'currentDayList' );
          domObj.addClass( 'currentDayList' )
            .show();
          }, 400 );
        }
      else {
        this.dom.addClass( 'currentDayList' )
          .show();
        }

      }
    ,"dataCreateListener": function( event ) {
      var note = event.items.inserted[ 0 ];

      var contentDiv = this.dom.find( '.listContent' );
      var state = contentDiv.attr( 'class' )
        .replace( /listContent/g, '' )
        .trim();

      if( 0 <= [ "loading","emtpy" ].indexOf( state ) ) {
        contentDiv.replaceWith( '<div class="listContent listing"></div>' );
        contentDiv = this.dom.find( '.listContent' );
        this.adjustBackground();
        }


      var itemTemplate = this.template.item;
      itemTemplate.match( /##\w+##/g )
        .forEach( function( elem ) {
          var fieldName = elem.replace( /#/g, '' )
            .toLowerCase();
          if( 'undefined' !== typeof note[ fieldName ] ) {
            itemTemplate = itemTemplate.replace( elem, note[ fieldName ] );
            return;
            }
          if( 'function' === typeof note[ 'get_' + fieldName ] ) {
            itemTemplate = itemTemplate.replace( elem, note[ 'get_' + fieldName ] );
            return;
            }
          var fieldNameCapitalized = fieldName;
          if( 0 < fieldName.indexOf( '_' ) ) {
            fieldName.match( /_\w/g )
              .forEach( function( character ) {
                fieldNameCapitalized = fieldNameCapitalized.replace( character, character.toUpperCase() );
                } );
            }
          if( 'undefined' !== typeof note[ fieldNameCapitalized ] ) {
            itemTemplate = itemTemplate.replace( elem, note[ fieldNameCapitalized ] );
            return;
            }
          if( 'function' === typeof note[ 'get' + fieldNameCapitalized.substr( 0, 1 )
              .toUpperCase() + fieldNameCapitalized.substr( 1 ) ] ) {
            itemTemplate = itemTemplate.replace( elem, note[ 'get' + fieldNameCapitalized.substr( 0, 1 )
              .toUpperCase() + fieldNameCapitalized.substr( 1 ) ] );
            return;
            }
          } );

      var domItem = $( itemTemplate );
      var backgroundDom = contentDiv.find( '.itemBackground' );
      if( backgroundDom.length <= 2 ) {
        backgroundDom.first()
          .before( domItem );
        }
      else {
        backgroundDom.first()
          .replaceWith( domItem );
        }

      // Remove comments:
      domItem = $( domItem )
        .map( function( elem ) {
          if( 1 != this.nodeType ) {
            return null;
            }
          return this;
          } );

      this.trigger( 'insert', {
        "inserted": [ domItem ]
        } );
      }
    ,"dataDeleteListener": function() {

      }
    ,"dataUpdateListener": function() {

      }
    ,"domCreateListener": function() {

      }
    ,"domDeleteListener": function() {

      }
    ,"domUpdateListener": function() {

      }

    ,"adjustBackground": function() {
        var totalHeight = $( '.diary' )
          .height();
        var lineHeight = $( '.itemList' )
          .height();
        var lines = 0;

        var thisObj = this;
        if( 0 === totalHeight || 0 === lineHeight ) {
          setTimeout( function() {
            thisObj.adjustBackground();
            }, 100 );
          return;
          }

        var contentDom = this.dom.find( '.listContent' );
        var contentItems = 1 + this.dom.find( '.item' )
          .length;

        if( contentItems >= Math.floor( totalHeight / lineHeight ) ) {
          contentItems = Math.floor( totalHeight / lineHeight ) - 2;
          }

        while( lines < 20 && contentItems != Math.floor( totalHeight / lineHeight ) ) {
          ++lines;
          if( contentItems < Math.floor( totalHeight / lineHeight ) ) {
            var newItem = $( '<div></div>' )
              .addClass( 'itemList' )
              .addClass( 'itemBackground' );
            contentDom.append( newItem );

            DailyListApp.DiaryView.attachBackgroundPageEvents( newItem );
            ++contentItems;
            }
          else {
            contentDom.find( '.itemBackground' )
              .first()
              .remove();
            --contentItems;
            }
          } //  END while
        } //  END method DailyListApp.DiaryView.adjustBackground()

    ,"_createDomElement": function( domParent ) {
        var template = this.template.root
          .replace( /##ID##/g, this.id )
          .replace( /##LIST##/g, '<div class="listContent loading">' + this.template.loading + '</div' );

        this.dom = $( template );
        domParent.append( this.dom );

        this.dom = $( '#' + this.id );
        } //  END private method _createDomElement
    } ); //  END class NoteList


var DailyList = NoteList.extend(
  'DailyList', {
    "date": Date.today()


    ,"construct": function( dataArray, domParent, listDate ) {
      if( 'undefined' === typeof date || null === date ) {
        var i = 1 / 0;
        }

      this.date = listDate;
      var dateRaw = this.date.getTime();

      this.id = this.template.id.replace( /##DATE_RAW##/g, dateRaw );

      this.__super__.call( this, dataArray, domParent );
      }

    ,"updateTitle": function() {
      var newTitle = '' + this.date.toString( 'MMM' )
        .substr( 0, 1 )
        .toUpperCase() + this.date.toString( 'MMM' )
        .substr( 1 )
        .toLowerCase() + '. ' + this.date.toString( 'yyyy' );

      DailyListApp.updateTitle( newTitle );
      }

    ,"_createDomElement": function( domParent ) {
        var dateDisplayedShort = '<sub>' + this.date.toString( 'ddd' )
          .substr( 0, 1 )
          .toUpperCase() + '</sub>' + this.date.toString( 'dd/MM' );

        var template = this.template.root
          .replace( /##ID##/g, this.id )
          .replace( /##DATE_DISPLAYED_SHORT##/g, dateDisplayedShort )
          .replace( /##LIST##/g, '<div class="listContent loading">' + this.template.loading + '</div' );

        this.dom = $( template );
        domParent.append( this.dom );

        this.dom = $( '#' + this.id );
        } //  END private method _createDomElement

    } ); //  END class DailyList


var CategoryList = NoteList.extend(
  'CategoryList', {
    "category": "none"


    ,"construct": function( dataArray, domParent, categoryName ) {
      if( 'undefined' === typeof date || null === date ) {
        var i = 1 / 0;
        }

      this.category = categoryName;

      this.id = this.template.id.replace( /##DATE_RAW##/g, this.category.replace( /[^\w]/g, '_' ) );

      this.__super__.call( this, dataArray, domParent );
      }

    ,"updateTitle": function() {
      var newTitle = '' + this.category;

      DailyListApp.updateTitle( newTitle );
      }

    ,"_createDomElement": function( domParent ) {

        var template = this.template.root
          .replace( /##ID##/g, this.id )
          .replace( /##DATE_DISPLAYED_SHORT##/g, '' )
          .replace( /##LIST##/g, '<div class="listContent loading">' + this.template.loading + '</div' );

        this.dom = $( template );
        domParent.append( this.dom );

        this.dom = $( '#' + this.id );
        } //  END private method _createDomElement

    } ); //  END class DailyList





var EditNotePage = EventtableObject.extend(
  'EditNotePage', {
    "note": null
    ,"domParent": $()
    ,"dom": $()

    ,"template": {
      "root": "<div class=\"editingItem\" style=\"position: fixed;\">" +
        "  <div style=\"height:0em;\" class=\"toolbar\"></div>" +
        "  <div style=\"margin-top:3em; padding:0.5em;\" class=\"noteData\">" +
        // bulletList
        // bullet
        // title
        // date
        // categories
        "  </div>" +
        "</div>"
      ,"bullet": "<div class=\"bullet\" name=\"##TYPE##\">##BULLET##</div>"
      ,"title": "<div class=\"title\">##TITLE##</div>"
      ,"date": "<div style=\"text-align:right;\"><span class=\"date\">##NOTE_DATE##</span> ##Editing.at## <span class=\"time\">##NOTE_TIME##</span></div>"
      ,"categoryList": "<div class=\"categoryList\">##LIST##</div>"
      ,"categoryItem": "<span class=\"category\">##NAME##</span>"

      ,"bulletList": "<div style=\"height: 2em; padding: 0.3em 0em;\" class=\"bulletList\">##LIST##</div>"
      ,"bulletItem": "<div class=\"bulletIcon ##SELECTED_CLASS##\" name=\"##NAME##\">##ICON##<div class=\"bulletCaption\">##CAPTION##</div></div>"
      }

    ,"construct": function( noteData, domNote ) {
console.log( 'Edit ' + noteData.type + ' ' + noteData.title );
      if( $( '.editingItem' )
        .length ) {
        return;
        }

      this.note = noteData;
      this.domParent = domNote;

      var noteDate = new Date( parseInt( this.note.time, 10 ) )
        .setTimezone( this.note.time.substring( this.note.time.indexOf( '+' ) ) );
      var posTop = this.domParent.offset()
        .top;
      var posHeight = this.domParent.height();

      var template = this.template.root;
      this.dom = $( template );

      var toolbarDom = this.dom.find( '.toolbar' );
      var editingDom = this.dom.find( '.noteData' );

      this.renderType( noteData, toolbarDom, editingDom );
      this.renderTitle( noteData, toolbarDom, editingDom );
      this.renderDate( noteData, toolbarDom, editingDom );
      this.renderCategories( noteData, toolbarDom, editingDom );

      if( 'function' === typeof noteData.renderEditPage ) {
        noteData.renderEditPage( toolbarDom, editingDom );
        }

      this.dom.css( 'top', posTop + 'px' )
        .css( 'height', posHeight + 'px' );


      domNote.append( this.dom );

      DailyListApp.Menu.hideAppTitle();
      }

    ,"renderType": function( noteData, toolbarDom, editingDom ) {
      var template = this.template.bulletList;
      var list = '';

      var bulletItemTemplate = this.template.bulletItem;
      Note.TYPE_NAMES.forEach( function( typeName ) {
        list += bulletItemTemplate
          .replace( /##NAME##/g, typeName.toLowerCase() )
          .replace( /##CAPTION##/g, L( typeName.toLowerCase() ) )
          .replace( /##ICON##/g, Note.TYPES[ typeName ].BULLET )
          .replace( /##SELECTED_CLASS##/g, ( typeName.toLowerCase() == noteData.type ) ? 'selected' : '' );
        } ); // end forEach ITEM_TYPE

      var bulletListDom = $( template.replace( /##LIST##/g, list ) );

      bulletListDom.find( '.bulletIcon' )
        .on( 'click', function() {
          var oldType = $( this )
            .siblings( '.selected' )
            .attr( 'name' );
          var newType = $( this )
            .attr( 'name' );
console.log( 'Update type ' + oldType + ' -> ' + newType );

          var selectedPos = $( this )
            .siblings( '.selected' )
            .offset();
          var clickedPos = $( this )
            .offset();

          // Reverse

          var bulletList = $( $( '.bulletList .bulletIcon' )
            .toArray()
            .reverse() );


          bulletList.each(
            function() {
              var pos = $( this )
                .offset();
              $( this )
                .css( 'position', 'fixed' )
                .offset( pos ); //.css('left', (0.0+pos.left)+'px');
              } );


          $( this )
            .css( 'transform', 'translateX(-' + ( clickedPos.left - selectedPos.left ) + 'px)' )
            .css( 'borderColor', '#EEECE2' );

          $( this )
            .siblings( '.selected' )
            .css( 'opacity', '0' );

          var clickedElement = $( this );

          setTimeout(
            function() {
              $( '.bulletList .bulletIcon' )
                .each(
                  function() {
                    $( this )
                      .css( {
                        "position": ""
                        ,"left": ""
                        ,"top": ""
                        ,"transform": ""
                        ,"borderColor": ""
                        ,"opacity": 1
                        } );
                    } );
              var nextThanClicked = clickedElement.next();
              var oldSelectedElement = clickedElement.siblings( '.selected' );

              oldSelectedElement.after( clickedElement );

              if( nextThanClicked.length > 0 ) {
                nextThanClicked.after( oldSelectedElement );
                }
              else {
                clickedElement.parent()
                  .append( oldSelectedElement );
                }

              oldSelectedElement.removeClass( 'selected' );
              clickedElement.addClass( 'selected' );
              }, 850 );

          Provider.update( noteData.id, {
            "type": newType
            } );
          } );

      editingDom.append( bulletListDom );



      editingDom.append( this.template.bullet.replace( /##BULLET##/g, '' ) );

      }

    ,"renderTitle": function( noteData, toolbarDom, editingDom ) {
      var titleDom = $( this.template.title.replace( /##TITLE##/g, noteData.title ) );

      SpanToInput.create(
        titleDom, {
          "inputId": "inputEditingTitle"
          ,"inputType": "text"
          ,"onChange": function( newValue ) {
            Provider.update( noteData.id, {
              "title": newValue.trim()
              } );

            this.text( newValue.trim() );
            }
          } ); //  end SpanToInput for editing title

      editingDom.append( titleDom );

      // Add toolbar buttons
      var thisObj = this;
      toolbarDom
        .prepend( $( '<div class="button" name="delete"></div>' )
          .on(
            'click'
            , function() {
              DailyListApp.persistence.deleteNote( noteData.id );
              thisObj.hide();
              } ) )
        .prepend( $( '<div class="button" name="back"></div>' )
          .on(
            'click'
            , function() {
              thisObj.hide();
              } )
        );


      }


    ,"renderDate": function( noteData, toolbarDom, editingDom ) {
      var noteDate = new Date( parseInt( noteData.time, 10 ) )
        .setTimezone( noteData.time.substring( noteData.time.indexOf( '+' ) ) );

      var dateDom = $( this.template.date
        .replace( /##NOTE_DATE##/g, noteDate.toString( 'dd/MM/yyyy' ) )
        .replace( /##NOTE_TIME##/g, noteDate.toString( 'HH:mm' ) )
        .replace( /##Editing.at##/g, L( 'Editing.at' ) ) );


      SpanToInput.create(
        dateDom.find( 'span.date' ), {
          "inputId": "inputEditingDate"
          ,"inputType": "date"
          ,"inputValue": noteDate.toString( 'yyyy-MM-dd' )
          ,"onEmpty": function() {
            var day = Date.today()
              .getDate();
            var month = Date.today()
              .getMonth();
            var year = Date.today()
              .getFullYear();

            var newDate = noteDate.clone();
            newDate.set( {
              "day": day
              ,"month": month
              ,"year": year
              } );
            var newDateValue = '' + newDate.getTime() + newDate.toString()
              .substr( 3 + newDate.toString()
                .indexOf( "GMT" ), 1 ) + "GMT" + newDate.toString()
              .substr( 4 + newDate.toString()
                .indexOf( "GMT" ), 2 ) + '';

            Provider.update( noteData.id, {
              "time": newDateValue
              } );

            this.text( newDate.toString( 'dd/MM/yyyy' ) );
            }
          ,"onCancel": function() {
            this.text( noteDate.toString( 'dd/MM/yyyy' ) );
            }
          ,"onChange": function( newValue ) {
            var newValues = newValue.split( '-' );
            if( newValue.indexOf( '/' ) > 0 ) {
              newValues = newValue.split( '/' );
              }

            if( 3 !== newValues.length || isNaN( parseInt( newValues[ 0 ], 10 ) ) || isNaN( parseInt( newValues[ 1 ], 10 ) ) || isNaN( parseInt( newValues[ 2 ], 10 ) ) ) {
              this.text( noteDate.toString( 'dd/MM/yyyy' ) ); // Not valid date. Rollback
              }
            else {
              var year = parseInt( newValues[ 0 ], 10 );
              var month = parseInt( newValues[ 1 ], 10 );
              var day = parseInt( newValues[ 2 ], 10 );
              if( day > 31 ) {
                year = parseInt( newValues[ 2 ], 10 );
                month = parseInt( newValues[ 1 ], 10 );
                day = parseInt( newValues[ 0 ], 10 );
                }

              if( 0 === day ) {
                day = 1;
                }
              if( 0 === month ) {
                month = 1;
                }
              if( day < 1 || month < 1 || year < 1970 || day > 31 || month > 12 ) {
                this.text( noteDate.toString( 'dd/MM/yyyy' ) ); // Not valid date. Rollback
                }
              else {
                var newDate = noteDate.clone();
                newDate.set( {
                  "day": day
                  ,"month": month - 1
                  ,"year": year
                  } );
                var newDateValue = '' + newDate.getTime() + newDate.toString()
                  .substr( 3 + newDate.toString()
                    .indexOf( "GMT" ), 1 ) + "GMT" + newDate.toString()
                  .substr( 4 + newDate.toString()
                    .indexOf( "GMT" ), 2 ) + '';

                Provider.update( noteData.id, {
                  "time": newDateValue
                  } );

                this.text( newDate.toString( 'dd/MM/yyyy' ) );
                }
              }
            }
          } ); //  end SpanToInput for editing date

      SpanToInput.create(
        dateDom.find( 'span.time' ), {
          "inputId": "inputEditingTime"
          ,"inputType": "time"
          ,"onEmpty": function() {
            var hour = new Date()
              .getHours();
            var minute = new Date()
              .getMinutes();

            var newDate = noteDate.clone();
            newDate.set( {
              "hour": hour
              ,"minute": minute
              } );
            var newDateValue = '' + newDate.getTime() + newDate.toString()
              .substr( 3 + newDate.toString()
                .indexOf( "GMT" ), 1 ) + "GMT" + newDate.toString()
              .substr( 4 + newDate.toString()
                .indexOf( "GMT" ), 2 ) + '';

            Provider.update( noteData.id, {
              "time": newDateValue
              } );

            this.text( newDate.toString( 'HH:mm' ) );
            }
          ,"onChange": function( newValue ) {
            newValue = newValue.trim()
              .replace( /[-.]/g, ':' );
            var newValues = newValue.split( ':' );

            if( newValues.length < 2 || isNaN( parseInt( newValues[ 0 ], 10 ) ) || isNaN( parseInt( newValues[ 1 ], 10 ) ) ) {
              return;
              }
            else {
              var hour = parseInt( newValues[ 0 ], 10 );
              var min = parseInt( newValues[ 1 ], 10 );

              if( 24 == hour ) {
                hour = 0;
                }
              if( 60 == min ) {
                min = 0;
                }
              if( hour < 0 || min < 0 || hour > 23 || min > 59 ) {
                return;
                }
              else {
                var newDate = noteDate.clone();
                newDate.set( {
                  "hour": hour
                  ,"minute": min
                  } );
                var newDateValue = '' + newDate.getTime() + newDate.toString()
                  .substr( 3 + newDate.toString()
                    .indexOf( "GMT" ), 1 ) + "GMT" + newDate.toString()
                  .substr( 4 + newDate.toString()
                    .indexOf( "GMT" ), 2 ) + '';

                Provider.update( noteData.id, {
                  "time": newDateValue
                  } );

                this.text( newDate.toString( 'HH:mm' ) );
                }
              }

            }
          } ); //  end SpanToInput for editing time


      editingDom.append( dateDom );
      }

    ,"renderCategories": function( noteData, toolbarDom, editingDom ) {
      var template = this.template.categoryList;

      if( 0 === noteData.lists.length ) {
        template = template.replace( /##LIST##/g, '' + L( 'Editing.No grouped' ) + '.' );
        }
      else {
        var list = '';

        var thisObj = this;
        noteData.lists.forEach( function( categoryItem ) {
          list += thisObj.template.categoryItem
            .replace( /##NAME##/g, categoryItem );
          } );

        template = template.replace( /##LIST##/g, '' + L( 'Editing.Grouped' ) + ': ' + list );
        }


      var categoriesDom = $( template );

      categoriesDom
        .one( 'click', function() {
          $( this )
            .addClass( 'active' );
          $( this )
            .find( '.category' )
            .each( function() {
              $( this )
                .append( '<span class="button" name="delete">&nbsp;&nbsp;&nbsp;&nbsp;</span>' )
                .one(
                  'click'
                  , function() {
                    Provider.update( elem.id, {
                      "lists": []
                      } );
                    $( this )
                      .parent()
                      .text( '' + L( 'Editing.No grouped' ) + '.' );
                    } );
              } );
          } );


      editingDom.append( categoriesDom );
      }


    ,"show": function() {
      this.dom.css( 'top', '0px' )
        .css( 'height', '100%' );
      this.dom.find( '.toolbar' )
        .css( 'height', '1.66em' );
      }
    ,"hide": function() {
      this.dom.find( '.toolbar' )
        .css( 'height', '0em' );

      var thisObj = this;
      setTimeout( function() {
        thisObj.dom.detach();
        }, 400 );
      }
    } );


var SpanToInput = Class.extend(
  'SpanToInput', {
    "defaultOptions": {
      "inputId": ""
      ,"inputType": "text"
      ,"inputClass": ""
      ,"inputValue": ""
      ,"onCancel": function( value, input, span ) {  }
      ,"onChange": function( newValue, oldVlaue, input, span ) {
console.log( 'Edited' );
        span.text( newValue );
        }

      }
    ,"options": {  }
    ,"dom": $()

    ,"construct": function( spanDom, options ) {
        this.options = {  };
        $.extend( this.options, this.defaultOptions, options );
        this.dom = $( spanDom );
        this.dom = $( spanDom )
          .map( function( elem ) {
            if( 1 != this.nodeType ) {
              return null;
              }
            return this;
            } );

        var thisObj = this;

        this.dom.on(
          'click'
          , function() {
console.log( 'Click on ' );
            var inputDom = $();
            if( '' !== thisObj.options.inputId ) {
              inputDom = thisObj.dom.siblings( 'input#' + thisObj.options.inputId );
              }
            if( 0 === inputDom.length ) {
              // Create <input>
              var width = $( thisObj.dom )
                .width();
              var oldValue = thisObj.options.inputValue;
              if( '' === oldValue ) {
                oldValue = thisObj.dom.get( 0 )
                  .innerHTML;
                }

              inputDom = $( '<input id="' + thisObj.options.inputId + '" type="' + thisObj.options.inputType + '" value="' + oldValue + '" class="' + thisObj.options.inputClass + '" style="width:' + ( width * 1.33 ) + 'px"></input>' );

              inputDom
                .on( 'keypress'
                  , function( event ) {
                    if( 13 == event.keyCode ) {
                      inputDom.blur(); // Code just DOWN
                      }
                    } );
              inputDom
                .on( 'blur'
                  , function() {
                    var newValue = inputDom.get( 0 )
                      .value;
                    newValue = newValue.trim();

                    if( '' === newValue ) {
                      thisObj.onEmpty();
                      }
                    else if( oldValue == newValue ) {
                      thisObj.onCancel();
                      }
                    else {
                      thisObj.onChange( newValue );
                      }

                    inputDom.detach();
                    thisObj.dom.show();
                    } );

              $( thisObj.dom )
                .after( inputDom );
              }

            $( thisObj.dom )
              .hide();
            inputDom.trigger( 'focus' )
              .trigger( 'click' );
            } );


        } //  END construct()

    ,"onEmpty": function( inputDom ) {
      if( 'function' === typeof this.options.onEmpty ) {
        this.options.onEmpty.call( this.dom, this.options.inputValue, inputDom, this.dom );
        }
      else {
        this.onCancel( inputDom );
        }
      }
    ,"onCancel": function( inputDom ) {
      if( 'function' === typeof this.options.onCancel ) {
        this.options.onCancel.call( this.dom, this.options.inputValue, inputDom, this.dom );
        }
      }
    ,"onChange": function( newValue, inputDom ) {
      if( 'function' === typeof this.options.onChange ) {
        this.options.onChange.call( this.dom, newValue, this.options.inputValue, inputDom, this.dom );
        }
      }

    } );
SpanToInput.create = function( dom, options ) {
  var s2i = new SpanToInput( dom, options );
  return s2i.dom;
  };



DailyListApp = {
  "DiaryView": {  }
  ,"i18n": {
    "en-US": {
      "First event title": "This is an event"
      ,"First task title": "This is a task"
      ,"First thought title": "This is a thought"
      ,"First spending title": "This is a registered spending - 0.99$"
      ,"First advices cat": "First advices"
      ,"event": "event"
      ,"Event": "Event"
      ,"task": "task"
      ,"Task": "Task"
      ,"thought": "thought"
      ,"Thought": "Thought"
      ,"spending": "spending"
      ,"Spending": "Spending"
      ,"Menu.Lists": "Lists"
      ,"Menu.Settings": "Settings"
      ,"Menu.About": "About"
      ,"Editing.Write down": "Write down a new note"
      ,"Editing.at": "at"
      ,"Editing.Grouped": "Grouped in"
      ,"Editing.No grouped": "No grouped"
      ,"Listing.Loading notes": "Loading"
      ,"": ""
      }
    ,"es-ES": {
      "First event title": "Esto es un recordatorio de un evento"
      ,"First task title": "Esto es una tarea por hacer"
      ,"First thought title": "Esto otro es un pensamiento espontáneo"
      ,"First spending title": "Y esto es un gasto - 0,99€"
      ,"First advices cat": "Primeros consejos"
      ,"event": "evento"
      ,"Event": "Evento"
      ,"task": "tarea"
      ,"Task": "Tarea"
      ,"thought": "idea"
      ,"Thought": "Idea"
      ,"spending": "gasto"
      ,"Spending": "Gasto"
      ,"Menu.Lists": "Listas"
      ,"Menu.Settings": "Configuración"
      ,"Menu.About": "Acerca de"
      ,"Editing.Write down": "Escribe aquí tu nota"
      ,"Editing.at": "a las"
      ,"Editing.Grouped": "Agrupado en"
      ,"Editing.No grouped": "Sin agrupar"
      ,"Listing.Loading notes": "Leyendo..."
      ,"": ""
      }
    }
  ,"config": {
    "language": ""
    }
  ,"getLiteral": function( key ) {
    var lang = DailyListApp.config.language;
    if( null === lang || '' === lang ) {
      lang = 'en-US';
      }
    var text = DailyListApp.i18n[ 'en-US' ][ key ];

    if( 'undefined' === typeof DailyListApp.i18n[ lang ] ) {
      lang = null;
      // Search other country.
      for( var otherLang in DailyListApp.i18n ) {
        if( null !== lang && 0 === otherLang.indexOf() ) {
          lang = otherLang;
          }
        }

      if( null === lang ) {
        lang = 'en-US';
        }
      else {
        DailyListApp.language = lang;
        }
      }

    if( 'undefined' !== typeof DailyListApp.i18n[ lang ][ key ] ) {
      text = DailyListApp.i18n[ lang ][ key ];
      }
    else {
      text = DailyListApp.i18n[ 'en-US' ][ key ];
      }

    if( null === text || '' === text ) {
      text = '<span style="color:red;">' + key + '</span>';
      }

    return text;
    }

  ,"init": function() {
    this.bindDeviceEvents();

    if( 'undefined' !== typeof $.mobile ) {
      $.mobile.page.prototype.options.disabled = true;
      }
    if( 'undefined' !== typeof $.event.special.tap ) {
      $.event.special.tap.tapholdThreshold = 500;
      //$.event.special.tap.emitTapOnTaphold = false;
      }

    window.setTimeout(
      function() {
        document.getElementById( 'deviceready' )
          .style.display = 'none';
        if( null === DailyListApp.config.language || '' === DailyListApp.config.language ) {
          DailyListApp.config.language = 'es-ES'; //'en-US';
          DailyListApp.updateI18N();
          }
        }, 2000 );

    // RESET:
    // localStorage.setItem( "itemsList", null ); localStorage.setItem( "config", null );

    var savedConfig = JSON.parse( localStorage.getItem( "config" ) );
    if( null === savedConfig ) {
      savedConfig = {  };
      }
    $.extend( DailyListApp.config, savedConfig );

    DailyListApp.Menu.init();

    DailyListApp.DiaryView.init();
    }

  ,"setLanguage": function( lang ) {
console.log( 'Lang:' + lang ); // es-ES
    DailyListApp.config.language = lang;

    localStorage.setItem( "config", JSON.stringify( DailyListApp.config ) );

    DailyListApp.updateI18N();
    }

  ,"updateI18N": function() {
    DailyListApp.DiaryView.updateI18N();
    }


  ,"updateTitle": function( newTitle ) {
    $( '.header' )
      .text( "- " + newTitle + ' -' );
    }


  // Bind Event Listeners
  //
  // Bind any events that are required on startup. Common events are:
  // 'load', 'deviceready', 'offline', and 'online'.
  ,"bindDeviceEvents": function() {
      document.addEventListener( 'deviceready', this.onDeviceReady, false );
      }
    // deviceready Event Handler
    //
    // The scope of 'this' is the event. In order to call the 'receivedEvent'
    // function, we must explicitly call 'app.receivedEvent(...);'
  ,"onDeviceReady": function() {
      DailyListApp.receivedEvent( 'deviceready' );
      if( navigator.globalization ) {
          navigator.globalization.getPreferredLanguage(
          function( language ) {
            DailyListApp.setLanguage( language.value ); // es-ES
            } );
        }
      else if( navigator.languages ) {
        DailyListApp.setLanguage( navigator.languages[0] ); // es-ES
        }

      }
    // Update DOM on a Received Event
  ,"receivedEvent": function( id ) {
    var parentElement = document.getElementById( id );
    var listeningElement = parentElement.querySelector( '.listening' );
    var receivedElement = parentElement.querySelector( '.received' );

    listeningElement.setAttribute( 'style', 'display:none;' );
    receivedElement.setAttribute( 'style', 'display:block;' );
console.log( 'Received Event: ' + id );
    }
  };
var L = DailyListApp.getLiteral;


DailyListApp.DiaryView = {
  "currentDay": new Date()
  ,"currentPage": $()
  ,"cachedPages": {  }

  ,"resizerTimeout": 0

  ,"init": function() {

      this.currentDay = Date.today();
      this.currentDay.setTimezoneOffset( new Date()
        .toString()
        .substr( new Date()
          .toString()
          .indexOf( 'GMT' ) + 3, 3 ) );
      this.currentDay.clearTime();

      this.backgroundDom = $( '.diary #background-list' );

      this.addDatePickerToTitle();

      $( '.diary div.list' )
        .not( '#background-list' )
        .remove();
      this.showCurrentDay( 'init' );
      } //  END method DailyListApp.DiaryView.init()

  ,"attachBackgroundPageEvents": function( backgroundDom ) {
      backgroundDom
        .on( 'click', function() {
          DailyListApp.DiaryView.showNewItemForm();
          } );

      backgroundDom
        .on( 'dblclick', function() {
          DailyListApp.Menu.toggleAppTitle();
          } );

      backgroundDom
        .on( 'taphold', function() {
          DailyListApp.Menu.toggleMenu();
          } );

      backgroundDom
        .on( 'swiperight', function( event ) {
          event.stopPropagation();
          if( $( '.editingItem' )
            .length ) {
            return;
            }

          DailyListApp.DiaryView.decreaseDay();
          } );

      backgroundDom
        .on( 'swipeleft', function( event ) {
          event.stopPropagation();
          if( $( '.editingItem' )
            .length ) {
            return;
            }

          DailyListApp.DiaryView.increaseDay();
          } );
      } //  END method DailyListApp.DiaryView.attachBackgroundPageEvents()

  ,"attachPageEvents": function() {

      } //  END method DailyListApp.DiaryView.attachPageEvents()

  ,"attachItemEvents": function( noteItem ) {
      noteItem
        .on( 'click', function() {
          // Edit
          var noteId = noteItem.attr( 'id' )
            .replace( 'item-', '' );
          var note = Provider.get( noteId );

          var ePage = new EditNotePage( note, $( '.diary' ) );

          ePage.show();
          } );

      noteItem
        .on( 'taphold', function() {
          // Edit
          noteItem.trigger( 'click' );
          } );

      // Hacking height
      if( noteItem.find( '.title' )
        .height() / noteItem.height() > 1.8 ) {

        var rect = noteItem[ 0 ].getBoundingClientRect();
        var computedHeight = ( 2.0 * noteItem.height() ) - 1;
        if( rect.height ) {
          // `width` is available for IE9+
          computedHeight = ( 2.0 * rect.height ) - 1;
          }
        else {
          // Calculate width for IE8 and below
          computedHeight = ( 2.0 * ( rect.bottom - rect.top ) ) - 1;
          }

        noteItem.css( 'height', computedHeight + 'px' );
        }

      } //  END method DailyListApp.DiaryView.attachItemEvents()

  ,"addDatePickerToTitle": function() {
      $( '.header' )
        .before(
          $( '<input></input>' )
          .attr( 'type', 'date' )
          .attr( 'id', 'datepicker' )
          .attr( 'value', this.currentDay.toString( 'yyyy-MM-dd' ) )
          .addClass( 'hidden' )
          .css( 'position', 'fixed' )
          .css( 'top', '0px' )
          .css( 'right', '0px' )
          .css( 'width', '0px' )
          .css( 'height', '0px' )
          .css( 'border', 'none' )
          .css( 'color', '#EEECE2' ) );

      $( '.header' )
        .on( 'click', function() {
          $( '#datepicker' )
            .trigger( 'focus' )
            .trigger( 'click' );
          } );

      $( '.header' )
        .on(
          'dblclick'
          , function() {
            var previousDate = DailyListApp.DiaryView.currentDay.clone();
            DailyListApp.DiaryView.currentDay = Date.today();
            DailyListApp.DiaryView.currentDay.setTimezoneOffset( new Date()
              .toString()
              .substr( new Date()
                .toString()
                .indexOf( 'GMT' ) + 3, 3 ) );

            DailyListApp.DiaryView.showCurrentDay();
            } );

      $( '#datepicker' )
        .on( 'change', function( ev ) {
          var newDateSelected = ev.target.value.trim();
          var previousDate = DailyListApp.DiaryView.currentDay.clone();


          if( '' === newDateSelected || '' !== newDateSelected.replace( /[0-9][0-9][0-9][0-9]-[0-1]?[0-9]-[0-9]?[0-9]/, '' ) ) {
            DailyListApp.DiaryView.currentDay = Date.today();
            DailyListApp.DiaryView.currentDay.setTimezoneOffset( new Date()
              .toString()
              .substr( new Date()
                .toString()
                .indexOf( 'GMT' ) + 3, 3 ) );
            }
          else {
            newDateSelected = newDateSelected.split( '-' );

            DailyListApp.DiaryView.currentDay.set( {
              "year": parseInt( newDateSelected[ 0 ], 10 )
              ,"month": parseInt( newDateSelected[ 1 ], 10 ) - 1
              ,"day": parseInt( newDateSelected[ 2 ], 10 )
              } );
            }

          DailyListApp.DiaryView.showCurrentDay();
          } );
      } //  END method DailyListApp.DiaryView.addDatePickerToTitle()

  ,"showCurrentDay": function( animation ) {
      DailyListApp.Menu.hideAppTitle();

      var currentDayTimestamp = this.currentDay.getTime();

      if( 'undefined' !== typeof this.cachedPages[ currentDayTimestamp ] ) {
        this.currentPage = this.cachedPages[ currentDayTimestamp ];
        }
      else {
        var listItems = new NoteArray();
        //Provider.read( currentDayTimestamp, listItems );
        Provider.read(
          function( noteValues ) {
            return ( 'undefined' !== typeof noteValues.time && !isNaN( parseInt( noteValues.time, 10 ) ) && parseInt( noteValues.time, 10 ) >= currentDayTimestamp && parseInt( noteValues.time, 10 ) < ( currentDayTimestamp + 86400000 ) );
            }
          , listItems );
        this.currentPage = new DailyList( listItems, $( '.diary' ), this.currentDay );
        this.currentPage.on(
          'insert'
          , function( event ) {
            DailyListApp.DiaryView.attachItemEvents( event.items.inserted[ 0 ] );
            } );

        this.cachedPages[ currentDayTimestamp ] = this.currentPage;
        }


      this.currentPage.show( animation );
      } //  END method DailyListApp.DiaryView.showCurrentDay()

  ,"showCategoryPage": function( categoryName ) {
      DailyListApp.Menu.hideAppTitle();

      var listItems = new NoteArray();
      if( '##TO DO##' == categoryName ) {
        categoryName = 'To do';
        Provider.read( function( noteValues ) {
          return ( 'task' == noteValues.type && 'undefined' !== typeof noteValues.status && 'done' != noteValues.status );
          }, listItems );

        }
      else if( '##SPENDING##' == categoryName ) {
        categoryName = 'Gastos';
        Provider.read( function( noteValues ) {
          return ( 'spending' == noteValues.type );
          //					&& 'undefined' !== typeof noteValues.status && 'done' != noteValues.status );
          }, listItems );

        }
      else {
        listItems = DailyListApp.persistence.getNotesByCategory( categoryName );
        }

      var cl = new CategoryList( listItems, $( '.diary' ), categoryName );
      cl.show();
      } //  END method DailyListApp.DiaryView.showCategoryPage()



  ,"renderNewItemForm": function() {
      var newItemDOM = $( '#newItem' );
      var pageDOM = $( '.currentDayList' );

      if( 0 === newItemDOM.length ) {
        if( 0 === pageDOM.length ) {
          pageDOM = $( '.currentDayList' );
          }

        newItemDOM = $(
          DailyListApp.DiaryView.templates.newItem
          .replace( /##DEFAULT_TYPE##/g, Note.TYPE_NAMES[ 0 ].toLowerCase() )
          .replace( /##DEFAULT_BULLET##/g, Note.TYPES[ Note.TYPE_NAMES[ 0 ] ].BULLET )
        );

        newItemDOM.find( 'input' )
          .attr( 'placeholder', L( "Editing.Write down" ) );

        newItemDOM.find( '#newTaskType' )
          .on(
            'click'
            , function() {
              if( 'none' == $( '.newTaskTypeToolbox' )
                .css( 'display' ) ) {
                $( '.newTaskTypeToolbox' )
                  .css( 'top', ( $( '#newTaskType' )
                    .position()
                    .top - $( '.newTaskTypeToolbox' )
                    .outerHeight() + 11 ) + 'px' );
                $( '.newTaskTypeToolbox' )
                  .css( 'left', ( $( '#newTaskType' )
                    .position()
                    .left - 15 ) + 'px' );
                $( '.newTaskTypeToolbox' )
                  .show();
                }
              else {
                $( '.newTaskTypeToolbox' )
                  .hide();
                }
              } );

        Note.TYPE_NAMES.forEach( function( typeName ) {
          newItemDOM.find( '.newTaskTypeToolbox' )
            .append(
              DailyListApp.DiaryView.templates.newItemBullet.replace( /##TYPE##/g, typeName.toLowerCase() )
              .replace( /##BULLET##/g, Note.TYPES[ typeName ].BULLET )
            );
          } );


        newItemDOM.find( '.newTaskTypeToolbox .bulletButton' )
          .on(
            'click'
            , function( ev ) {
              var targetDOM = $( ev.target );
              var type = targetDOM.attr( 'name' );
              var text = targetDOM.text()
                .trim();

              $( '#newTaskType' )
                .attr( 'name', type )
                .get( 0 )
                .innerHTML = text;

              $( '.newTaskTypeToolbox' )
                .hide();

              newItemDOM.find( 'input' )
                .focus();
              } );


        newItemDOM.find( 'input' )
          .on( 'keypress', function( event ) {
            if( 13 == event.keyCode ) {
              DailyListApp.persistence.createNote( DailyListApp.DiaryView.currentDay );
              }
            } );

        newItemDOM.find( 'input' )
          .on( 'blur', function( event ) {
            var currentValue = event.target.value.trim();
            if( '' !== currentValue ) {
              setTimeout(
                function() {
                  if( 'none' == $( '.newTaskTypeToolbox' )
                    .css( 'display' ) ) {
                    DailyListApp.persistence.createNote( DailyListApp.DiaryView.currentDay );
                    }
                  }
                , 100 );
              }
            } );
        }

      pageDOM.find( '.itemBackground' )
        .first()
        .replaceWith( newItemDOM );
      // pageDOM.append( newItemDOM );

      return newItemDOM;
      } //  END method DailyListApp.DiaryView.renderNewItemForm()

  ,"showNewItemForm": function() {
      if( $( '#newItem' )
        .length > 0 ) {
        if( '' !== $( '#newItem input' )
          .get( 0 )
          .value.trim() ) {
          $( '#newItem input' )
            .blur();
          }
        else {
          $( '#newItem' )
            .replaceWith( $( '<div></div>' )
              .addClass( 'itemList' )
              .addClass( 'itemBackground' ) );
          }
        }
      else {
        var newItemDOM = this.renderNewItemForm();
        newItemDOM.show();
        newItemDOM.find( 'input' )
          .trigger( 'focus' )
          .trigger( 'click' );
        }
      } //  END method DailyListApp.DiaryView.showNewItemForm()



  ,"decreaseDay": function() {
      var previousDate = this.currentDay.clone();
      this.currentDay.add( -1 )
        .day();

      this.showCurrentDay( 'decrease' );
      } //  END method DailyListApp.DiaryView.decreaseDay()

  ,"increaseDay": function() {
      var previousDate = this.currentDay.clone();
      this.currentDay.add( 1 )
        .day();

      this.showCurrentDay( 'increase' );
      } //  END method DailyListApp.DiaryView.increaseDay()

  ,"updateI18N": function() {
      var numNotes = Provider.count();

      if( 0 === numNotes ) {
        var now = this.currentDay.clone();
        now.setTimeToNow();
        var time = '' + now.getTime() + now.toString()
          .substr( 3 + now.toString()
            .indexOf( "GMT" ), 1 ) + "GMT" + now.toString()
          .substr( 4 + now.toString()
            .indexOf( "GMT" ), 2 ) + '';

        Provider.create( {
          "type": "event"
          ,"app": "DailyListBeta"
          ,"title": L( "First event title" )
          ,"time": time
          ,"status": ""
          ,"modifier": ""
          ,"lists": [ L( "First advices cat" ) ]
          ,"periodicity": ""
          } );
        Provider.create( {
          "type": "task"
          ,"app": "DailyListBeta"
          ,"title": L( "First task title" )
          ,"time": time
          ,"status": ""
          ,"modifier": ""
          ,"lists": [ L( "First advices cat" ) ]
          ,"periodicity": ""
          } );
        Provider.create( {
          "type": "thought"
          ,"app": "DailyListBeta"
          ,"title": L( "First thought title" )
          ,"time": time
          ,"status": ""
          ,"modifier": ""
          ,"lists": [ L( "First advices cat" ) ]
          ,"periodicity": ""
          } );
        Provider.create( {
          "type": "spending"
          ,"app": "DailyListBeta"
          ,"title": L( "First spending title" )
          ,"time": time
          ,"status": ""
          ,"modifier": ""
          ,"lists": [ L( "First advices cat" ) ]
          ,"periodicity": ""
          } );

        // Re-paint

        // DailyListApp.DiaryView.showCurrentDay();
        this.showCurrentDay();
        }

      } //  END method DailyListApp.DiaryView.updateI18N()

  }; //  END DailyListApp.DiaryView


DailyListApp.Menu = {
    "init": function() {
        $( '.menu .menu-icon' )
          .on( 'click', function() {
            DailyListApp.Menu.toggleMenu();
            } );

        $( '.menu .background' )
          .on( 'click', function() {
            DailyListApp.Menu.hideAppTitle();
            } );

        } //  END method DailyListApp.Menu.init()

    ,"isShownAppTitle": function() {
        return ( 'none' != $( '.menu' )
          .css( 'display' ) );
        } //  END method DailyListApp.Menu.isShownAppTitle()

    ,"isShownMenu": function() {
        return ( 'none' != $( '.menu .panel' )
          .css( 'display' ) );
        } //  END method DailyListApp.Menu.isShownMenu()

    ,"showAppTitle": function() {
        if( this.isShownAppTitle() ) {
          return;
          }

        $( '.menu' )
          .show()
          .css( 'height', '2.66em' );
        //		$('.header').css('top', '2.66em');
        //		$('.diary').css('top', (2.66+1.66)+'em');

        } //  END method DailyListApp.Menu.showAppTitle()

    ,"showMenu": function() {
        if( !this.isShownAppTitle() ) {
          this.showAppTitle();
          }
        if( this.isShownMenu() ) {
          return;
          }

        // Show menu
        $( '.menu .menu-icon div' )
          .addClass( 'selected' );
        $( '.menu .background' )
          .css( 'display', 'block' )
          .css( 'opacity', 0.6 );
        $( '.menu .panel' )
          .css( 'display', 'block' )
          .css( 'width', ( $( 'body' )
            .width() / 3 ) + 'px' );
        setTimeout( function() {
          $( '.menu .panel' )
            .css( 'width', '33%' );
          }, 410 );

        $( '.menu .panel > div' )
          .get( 0 )
          .innerHTML = L( 'Menu.Lists' );
        $( '.menu .lists' )
          .append(
            $( '<div style="font-size:80%;margin-left:1em;cursor:pointer;">' + 'To do' + '</div>' )
            .on( 'click', function() {
              DailyListApp.DiaryView.showCategoryPage( '##TO DO##' );
              DailyListApp.Menu.hideMenu();
              } )
          );

        $( '.menu .lists' )
          .append(
            $( '<div style="font-size:80%;margin-left:1em;cursor:pointer;">' + 'Gastos octubre' + '</div>' )
            .on( 'click', function() {
              DailyListApp.DiaryView.showCategoryPage( '##SPENDING##' );
              DailyListApp.Menu.hideMenu();
              } )
          );

        var lists = Provider.getLists();
        lists.forEach( function( listItem ) {
          $( '.menu .lists' )
            .append(
              $( '<div style="font-size:80%;margin-left:1em;cursor:pointer;">' + listItem + '</div>' )
              .on( 'click', function() {
                DailyListApp.DiaryView.showCategoryPage( listItem );
                DailyListApp.Menu.hideMenu();
                } )
            );
          } );

        $( '.menu .panel > div' )
          .get( 1 )
          .innerHTML = L( 'Menu.Settings' );
        $( '.menu .panel > div' )
          .get( 2 )
          .innerHTML = L( 'Menu.About' );

        $( $( '.menu .panel > div' ).get( 1 ) )
          .append(
            $( '<div style="font-size:80%;margin-left:1em;cursor:pointer;">' + 'Import' + '</div>' )
              .on( 'click', function() {
                DailyListApp.Menu.hideAppTitle();

                $( 'textarea.ical' )
                  .val( 'Paste here iCal content' )
                  .css( 'width', '300px' )
                  .css( 'width', '-webkit-fill-available' )
                  .css( 'width', 'fill-available' )
                  .css( 'width', '-moz-available' )
                  .css( 'height', '100px' );

                $( '.diary' ).append(
                  $( '<button></button>' )
                    .attr( 'value', 'ICAL' )
                    .css( 'position', 'fixed' )
                    .css( 'right', '30px' )
                    .css( 'bottom', '20px' )
                    .css( 'z-index', '10' )
                    .css( 'width', '50px' )
                    .css( 'height', '40px' )
                    .css( 'background', '#EA1500' )
                    .css( 'border', 'none' )
                    .css( 'border-radius', '40px' )
                    .css( 'color', 'white' )
                    .css( 'cursor', 'pointer' )
                    .text( 'ICal' )
                    .on( 'click', function() {
                      var icalString = $( 'textarea.ical' ).val();
                      if( '' !== icalString.trim() ) {
                        setTimeout( function() {
                          var jsonString = fromICAL( icalString );
                          $( 'textarea.ical' ).val( jsonString ).select();
                          }, 50 );
                        $( 'textarea.ical' ).val( 'Processing...' );
                        }
                      else {
                        $( 'textarea.ical' )
                          .css( 'width', '0' )
                          .css( 'height', '0px' );
                        }
                      $( this ).remove();
                      } )
                    );

                } )
            )  //  END append Import option-menu
          .append(
            $( '<div style="font-size:80%;margin-left:1em;cursor:pointer;">' + 'Export' + '</div>' )
              .on( 'click', function() {
                DailyListApp.Menu.hideAppTitle();

                setTimeout( function() {
                  var icalString = toICAL();
                  $( 'textarea.ical' ).val( icalString ).select();

                  }, 50 );

                $( 'textarea.ical' )
                  .val( '' )
                  .css( 'width', '300px' )
                  .css( 'width', '-webkit-fill-available' )
                  .css( 'width', 'fill-available' )
                  .css( 'width', '-moz-available' )
                  .css( 'height', '100px' );

                return false;
                } )
            );  //  END append Export option-menu


        } //  END method DailyListApp.Menu.showMenu()

    ,"hideAppTitle": function() {
        if( !this.isShownAppTitle() ) {
          return;
          }
        if( this.isShownMenu() ) {
          this.hideMenu();
          }


        $( '.menu' )
          .css( 'height', '0em' );
        //$('.header').css('top', '0em');
        //$('.diary').css('top', (1.66)+'em');
        setTimeout( function() {
          $( '.menu' )
            .hide();
          }, 410 );

        } //  END method DailyListApp.Menu.hideAppTitle()

    ,"hideMenu": function() {
        if( !this.isShownMenu() ) {
          return;
          }

        // Hide menu
        $( '.menu .menu-icon div' )
          .removeClass( 'selected' );
        $( '.menu .background' )
          .css( 'opacity', 0.0 );
        $( '.menu .panel' )
          .css( 'width', ( $( 'body' )
            .width() / 3 ) + 'px' )
          .css( 'width', '0px' );
        setTimeout( function() {
          $( '.menu .background' )
            .css( 'display', 'none' );
          $( '.menu .panel' )
            .css( 'display', 'none' );
          }, 410 );

        } //  END method DailyListApp.Menu.hideMenu()

    ,"toggleAppTitle": function() {
        if( this.isShownAppTitle() ) {
          this.hideAppTitle();
          } else {
          this.showAppTitle();
          }
        } //  END method DailyListApp.Menu.toggleAppTitle()

    ,"toggleMenu": function() {
        if( this.isShownMenu() ) {
          this.hideMenu();
          } else {
          this.showMenu();
          }
        }  //  END method DailyListApp.Menu.toggleMenu()


    };  //  END DailyListApp.Menu


DailyListApp.persistence = {
  "createNote": function( currentDay ) {
    // Read values
    var values = {
      "type": "task" // event - task - thought - spending
      ,"app": "DailyListBeta"
      ,"title": ""
      ,"time": ""
      ,"status": ""
      ,"modifier": ""
      ,"lists": []
      ,"periodicity": ""
      };

    var now = currentDay.clone();
    now.setTimeToNow();

    values.title = $( '#newItem input' )
      .get( 0 )
      .value;
    values.type = $( '#newTaskType' )
      .attr( 'name' );
    values.time = '' + now.getTime() + now.toString()
      .substr( 3 + now.toString()
        .indexOf( "GMT" ), 1 ) + "GMT" + now.toString()
      .substr( 4 + now.toString()
        .indexOf( "GMT" ), 2 ) + '';

    values.title = values.title.trim();

    if( '' !== values.title ) {
      var separator = '';
      if( [ '.', ' - ' ].some( function( sep ) {
          if( values.title.indexOf( sep ) >= 0 ) {
            separator = sep;
            return true;
            }
          } ) ) {
console.log( separator );
        var list = values.title.substr( 0, values.title.indexOf( separator ) );
console.log( list );
        values.lists.push( list );
        }

      // Validate

      // Call Provider

      Provider.create( values );

      }

    $( '#newItem' )
      .replaceWith( $( '<div></div>' )
        .addClass( 'itemList' )
        .addClass( 'itemBackground' ) );
    DailyListApp.DiaryView.currentPage.adjustBackground();
    }

  ,"deleteNote": function( itemId ) {
    Provider.delete( itemId );

    $( '#item-' + itemId )
      .remove();
    DailyListApp.DiaryView.currentPage.dataDeleteListener();
    }

  ,"getNotesByDay": function( dateDay ) {
    var day = dateDay.clone();
    day.set( {
      "hour": 0
      ,"minute": 0
      ,"second": 0
      } );

    var timestampFrom = day.getTime();
    var timestampTo = ( 86400 * 1000 ) + timestampFrom;

    return Provider.read( function( noteValues ) {
      return ( noteValues.time >= timestampFrom && noteValues.time < timestampTo );
      } );
    }

  ,"getNotesByCategory": function( categoryName ) {
    var list = new NoteArray();
    Provider.read( function( noteValues ) {
      return ( 'undefined' !== typeof noteValues.lists && $.isArray( noteValues.lists ) && noteValues.lists.indexOf( categoryName ) >= 0 );
      }, list );
    return list;
    }
  };

DailyListApp.DiaryView.templates = {
  "newItem": "<div id=\"newItem\" class=\"itemList new\">" +
    "    <div style=\"display:none;\"></div>" +
    "    <div id=\"newTaskModif\" class=\"bullet\">&nbsp;</div>" +
    "    <div class=\"newTaskTypeToolbox\" style=\"display: none;\"></div>" +
    "    <div id=\"newTaskType\" class=\"bullet\" name=\"##DEFAULT_TYPE##\">##DEFAULT_BULLET##</div>" +
    "    <div style=\"overflow: hidden;\">" +
    "        <input type=\"text\" placeholder=\"Write down a new note\">" +
    "    </div>" +
    "</div>  <!-- .itemList #newItem -->"
  ,"newItemBullet": "<div class=\"bulletButton\" name=\"##TYPE##\">##BULLET##</div>"
  };

$( function() {
  DailyListApp.init();
  } );
