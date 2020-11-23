(()=>{"use strict";var t={d:(e,n)=>{for(var o in n)t.o(n,o)&&!t.o(e,o)&&Object.defineProperty(e,o,{enumerable:!0,get:n[o]})},o:(t,e)=>Object.prototype.hasOwnProperty.call(t,e),r:t=>{"undefined"!=typeof Symbol&&Symbol.toStringTag&&Object.defineProperty(t,Symbol.toStringTag,{value:"Module"}),Object.defineProperty(t,"__esModule",{value:!0})}},e={};t.r(e),t.d(e,{clear:()=>_,drawLine:()=>U,fill:()=>J});var n=document.getElementById("player-container"),o=document.getElementById("word-container"),a=document.getElementById("rounds"),r=document.getElementById("time-left"),i=document.getElementById("drawing-board"),l=document.getElementById("start-dialog"),c=document.getElementById("start-game-button"),s=document.getElementById("word-dialog"),d=document.getElementById("word-button-zero"),u=document.getElementById("word-button-one"),f=document.getElementById("word-button-two"),g=function(){return window.baseWidth/i.clientWidth},h=function(){return i.clientWidth/window.baseWidth},y=function(){for(var t=arguments.length,e=new Array(t),n=0;n<t;n++)e[n]=arguments[n];return e.map((function(t){return t*h()}))},m=(document.getElementById("message-container"),document.getElementById("message-input")),p=document.getElementById("message-form"),v=document.getElementById("color-picker"),w=(document.getElementById("center-dialog"),document.getElementById("chat"),document.getElementById("erase-tool")),b=document.getElementById("clear-tool"),k=document.getElementById("draw-tool"),I=document.getElementById("fill-tool"),E=document.getElementById("small-circle"),O=document.getElementById("medium-circle"),S=document.getElementById("huge-circle"),T=function(t){E.className=0==t?"active":"",O.className=1==t?"active":"",S.className=2==t?"active":""};function C(t){var e=/^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(t);return e?{r:parseInt(e[1],16),g:parseInt(e[2],16),b:parseInt(e[3],16)}:null}function B(t){var e=C(t);return"rgb("+e.r+","+e.g+","+e.b+")"}function H(t,e){var n=Object.keys(t);if(Object.getOwnPropertySymbols){var o=Object.getOwnPropertySymbols(t);e&&(o=o.filter((function(e){return Object.getOwnPropertyDescriptor(t,e).enumerable}))),n.push.apply(n,o)}return n}function M(t){for(var e=1;e<arguments.length;e++){var n=null!=arguments[e]?arguments[e]:{};e%2?H(Object(n),!0).forEach((function(e){D(t,e,n[e])})):Object.getOwnPropertyDescriptors?Object.defineProperties(t,Object.getOwnPropertyDescriptors(n)):H(Object(n)).forEach((function(e){Object.defineProperty(t,e,Object.getOwnPropertyDescriptor(n,e))}))}return t}function x(t,e){for(var n=0;n<e.length;n++){var o=e[n];o.enumerable=o.enumerable||!1,o.configurable=!0,"value"in o&&(o.writable=!0),Object.defineProperty(t,o.key,o)}}function D(t,e,n){return e in t?Object.defineProperty(t,e,{value:n,enumerable:!0,configurable:!0,writable:!0}):t[e]=n,t}const j=new(function(){function t(){!function(t,e){if(!(t instanceof e))throw new TypeError("Cannot call a class as a function")}(this,t),D(this,"state",{allowDrawing:!1,localColor:"#000000",localLineWidth:5,localLineWidthUnscaled:5,localTool:0,ownID:null,ownerID:null,maxRounds:0,roundEndTime:0}),D(this,"handlers",[]),D(this,"_updating",!1)}var e,n;return e=t,(n=[{key:"setState",value:function(t){if(this._updating)console.error("cannot set state in state handlers");else{this._updating=!0;try{var e=M({},this.state);this.state=M(M({},this.state),t),console.log("prev state",e),console.log("next state",this.state),this._propagate(e)}catch(t){console.error(t)}this._updating=!1}}},{key:"_propagate",value:function(t){var e=this;this.handlers.map((function(n){return n(e.state,t)}))}},{key:"registerHandler",value:function(t){return this.handlers.push(t),function(){this.handlers.filter((function(e){return e!=t}))}}},{key:"reset",value:function(){var t=M({},this.state);this.state={},this.handlers=[],this._propagate(t)}}])&&x(e.prototype,n),t}());function W(t,e){for(var n=0;n<e.length;n++){var o=e[n];o.enumerable=o.enumerable||!1,o.configurable=!0,"value"in o&&(o.writable=!0),Object.defineProperty(t,o.key,o)}}const L=new(function(){function t(){var e,n,o=this;!function(t,e){if(!(t instanceof e))throw new TypeError("Cannot call a class as a function")}(this,t),n={},(e="handlers")in this?Object.defineProperty(this,e,{value:n,enumerable:!0,configurable:!0,writable:!0}):this[e]=n;var a="ws://"+location.hostname+":"+location.port+"/v1/ws?lobby_id="+window.lobbyId;this.socket=new ReconnectingWebSocket(a,null,{debug:!0,reconnectInterval:3e3,automaticOpen:!1}),this.socket.onmessage=function(t){var e=JSON.parse(t.data);void 0!==o.handlers[e.type]?o.handlers[e.type](e):console.error("socket received unknown message type "+e.type)},this.socket.onerror=function(t){return console.error("websocket error: ",t)}}var e,n;return e=t,(n=[{key:"open",value:function(){this.socket.open()}},{key:"addHandler",value:function(t,e){this.handlers[t]=e}},{key:"sendStart",value:function(){this.socket.send(JSON.stringify({type:"start"}))}},{key:"sendClear",value:function(){this.socket.send(JSON.stringify({type:"clear-drawing-board"}))}},{key:"sendMessage",value:function(t){this.socket.send(JSON.stringify({type:"message",data:t}))}},{key:"sendChooseWord",value:function(t){this.socket.send(JSON.stringify({type:"choose-word",data:t}))}},{key:"sendKickVote",value:function(t){this.socket.send(JSON.stringify({type:"kick-vote",data:t}))}},{key:"sendFill",value:function(t,e,n){this.socket.send(JSON.stringify({type:"fill",data:{x:t,y:e,color:n}}))}},{key:"sendLine",value:function(t,e,n,o,a,r){var i={type:"line",data:{fromX:t,fromY:e,toX:n,toY:o,color:a,lineWidth:r}};this.socket.send(JSON.stringify(i))}}])&&W(e.prototype,n),t}());function X(t){L.sendChooseWord(t),hide("#word-dialog"),s.style.display="none",$("#cc-toolbox").css({transform:"translateX(0)"}),$("#player-container").css({transform:"translateX(-150%)"}),j.setState({allowDrawing:!0})}function F(t,e,n,o){var a,r=j.state,i=r.localColor,l=r.localLineWidth;U(t,e,n,o,a=1===r.localTool?"#ffffff":i,l);var c=t*g(),s=e*g(),d=n*g(),u=o*g(),f=l*g();L.sendLine(c,s,d,u,a,f)}function P(t){var e;void 0===t?e=v.value:(t=function(t){if(/^#[0-9A-F]{6}$/i.test(t))return t;function e(t){return("0"+parseInt(t).toString(16)).slice(-2)}return"#"+e((t=t.match(/^rgb\((\d+),\s*(\d+),\s*(\d+)\)$/))[1])+e(t[2])+e(t[3])}(t),v.value=t,e=t),j.setState({localColor:e})}function N(t){j.setState({localLineWidthUnscaled:t,localLineWidth:t*h()})}function Y(t){0!==t&&1!==t&&2!==t||j.setState({localTool:t})}var R=i.getContext("2d");function A(){i.width=i.clientWidth,i.height=i.clientHeight,j.setState({localLineWidthUnscaled:j.state.localLineWidthUnscaled,localLineWidth:j.state.localLineWidthUnscaled*h()})}function _(){R.fillStyle="#FFFFFF",R.fillRect(0,0,i.width,i.height)}function J(t,e,n){R.fillStyle=n,R.fillFlood(t,e,1)}function U(t,e,n,o,a,r){t=Math.floor(t),e=Math.floor(e),n=Math.floor(n),o=Math.floor(o),r=Math.ceil(r),a=C(a);for(var i=function(t){for(var e=[],n=0;n<2*t;n++){e[n]=[];for(var o=0;o<2*t;o++){var a=Math.sqrt(Math.pow(t-n,2)+Math.pow(t-o,2));e[n][o]=a>t?0:a<t-2?2:1}}return e}(Math.floor(r/2)),l=Math.floor(i.length/2),c=R.getImageData(0,0,R.canvas.clientWidth,R.canvas.clientHeight),s=0;s<i.length;s++)for(var d=0;d<i[s].length;d++)(1===i[s][d]||t===n&&e===o&&2===i[s][d])&&V(c,t+s-l,e+d-l,n+s-l,o+d-l,a);R.putImageData(c,0,0)}function V(t,e,n,o,a,r){for(var i=Math.abs(o-e),l=Math.abs(a-n),c=e<o?1:-1,s=n<a?1:-1,d=i-l;;){if(e<0||e>=t.width||n<0||n>=t.height)return;if(q(t,e,n,r),e===o&&n===a)break;var u=2*d;u>-l&&(d-=l,e+=c),u<i&&(d+=i,n+=s)}}function q(t,e,n,o){var a=4*(n*t.width+e);t.data[a]=o.r,t.data[a+1]=o.g,t.data[a+2]=o.b,t.data[a+3]=255}A(),window.addEventListener("resize",A,!1);var z=!1,K=0,G=0,Q=0;function Z(t){var e=new Audio(t);e.type="audio/wav",e.play()}function tt(t){return function(t){if(Array.isArray(t))return et(t)}(t)||function(t){if("undefined"!=typeof Symbol&&Symbol.iterator in Object(t))return Array.from(t)}(t)||function(t,e){if(t){if("string"==typeof t)return et(t,e);var n=Object.prototype.toString.call(t).slice(8,-1);return"Object"===n&&t.constructor&&(n=t.constructor.name),"Map"===n||"Set"===n?Array.from(t):"Arguments"===n||/^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n)?et(t,e):void 0}}(t)||function(){throw new TypeError("Invalid attempt to spread non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method.")}()}function et(t,e){(null==e||e>t.length)&&(e=t.length);for(var n=0,o=new Array(e);n<e;n++)o[n]=t[n];return o}function nt(t){var e=j.state.ownID;n.innerHTML="",t.forEach((function(t){if(t.connected){t.state;var o='<div class="playerBox"> <img src="../resources/image/avatar_phillip.png" alt=""><div class="name';o+='">'+t.name+"</div>",t.id!==e&&(o+='<button class="kick-button" id="kick-button" type="button" title="Vote to kick this player" alt="Vote to kick this player" onclick="onClickKickButton('+t.id+')">👋</button>'),o+='<span class="score">'+t.score+'</span><span class="last-turn-score">(Last turn: '+t.lastScore+")</span></div>",1===t.state?o+="<span>✏️</span>":2===t.state&&(o+="<span>✔️</span>"),o+="</div></div></div>";var a=document.createRange().createContextualFragment(o);console.log(a),n.appendChild(a)}}))}function ot(t,e){a.innerText="Round "+t+" of "+e}function at(t){o.innerHTML="",t.forEach((function(t){if(0===t.character)o.innerHTML+='<span class="guess-letter guess-letter-underline">&nbsp;</span>';else{var e=String.fromCharCode(t.character);t.underline?o.innerHTML+='<span class="guess-letter guess-letter-underline">'+e+"</span>":o.innerHTML+='<span class="guess-letter">'+e+"</span>"}}))}i.ontouchstart=function(t){var e=j.state,n=e.allowDrawing,o=e.localTool;if(!z&&n&&(Q=t.touches[0].identifier,n&&2!==o)){var a=i.getBoundingClientRect();K=t.touches[0].clientX-a.left,G=t.touches[0].clientY-a.top,z=!0}},i.ontouchmove=function(t){var e=j.state.allowDrawing;if(t.preventDefault(),e&&z)for(var n=t.changedTouches.length-1;n>=0;n--)if(t.changedTouches[n].identifier===Q){var o=t.changedTouches[n],a=i.getBoundingClientRect(),r=o.clientX-a.left,l=o.clientY-a.top;return F(K,G,r,l),K=r,void(G=l)}},i.ontouchcancel=function(t){if(z)for(var e=t.changedTouches.length-1;e>=0;e--)if(t.changedTouches[e].identifier===Q)return void(z=!1)},i.ontouchend=i.ontouchcancel,i.onmousedown=function(t){var e=j.state,n=e.allowDrawing,o=e.localTool;return n&&0===t.button&&2!==o&&(K=t.offsetX,G=t.offsetY,z=!0),!1},window.onmouseup=function(t){!0===z&&(z=!1)},i.onmousemove=function(t){if(j.state.allowDrawing&&!0===z&&0===t.button){var e=i.getBoundingClientRect(),n=t.clientX-e.left,o=t.clientY-e.top;F(K,G,n,o),K=n,G=o}},i.onmouseenter=function(t){K=t.offsetX,G=t.offsetY},i.onclick=function(t){var e=j.state,n=e.allowDrawing,o=e.localTool;n&&0===t.button&&(2===o?function(t,e){J(t,e,j.state.localColor);var n=t*g(),o=e*g();L.sendFill(n,o,j.state.localColor)}(t.offsetX,t.offsetY):F(t.offsetX,t.offsetY,t.offsetX,t.offsetY),z=!1)},L.addHandler("ready",(function(t){var n,o=t.data;j.setState({ownerID:o.ownerId,allowDrawing:o.drawing,ownID:o.playerId,maxRounds:o.maxRounds,roundEndTime:o.roundEndTime}),ot(o.round,o.maxRounds),0===o.round&&o.ownerId===o.playerId&&(show("#start-dialog"),l.style.display="block"),o.players&&o.players.length&&nt(o.players),o.currentDrawing&&o.currentDrawing.length&&(n=o.currentDrawing,_(),n.forEach((function(t){var n=t.data;"fill"===t.type?J.apply(e,tt(y(n.x,n.y)).concat([n.color])):"line"===t.type?U.apply(e,tt(y(n.fromX,n.fromY,n.toX,n.toY)).concat([n.color,y(n.lineWidth)[0]])):console.log("Unknown draw element type: "+n.type)}))),o.wordHints&&o.wordHints.length&&at(o.wordHints)})),L.addHandler("update-players",(function(t){nt(t.data)})),L.addHandler("correct-guess",(function(t){Z("/resources/plop.wav")})),L.addHandler("update-wordhint",(function(t){at(t.data)})),L.addHandler("message",(function(t){messages.applyMessage("",t.data.author,t.data.content)})),L.addHandler("system-message",(function(t){messages.applyMessage("system-message","System",t.data)})),L.addHandler("non-guessing-player-message",(function(t){messages.applyMessage("non-guessing-player-message",t.data.author,t.data.content)})),L.addHandler("persist-username",(function(t){document.cookie="username="+t.data+";expires=Tue, 19 Jan 2038 00:00:00 UTC;path=/;samesite=strict"})),L.addHandler("reset-username",(function(t){document.cookie="username=; expires=Thu, 01 Jan 1970 00:00:00 GMT"})),L.addHandler("line",(function(t){U.apply(e,tt(y(t.data.fromX,t.data.fromY,t.data.toX,t.data.toY)).concat([t.data.color,y(t.data.lineWidth)[0]]))})),L.addHandler("fill",(function(t){J.apply(e,tt(y(t.data.x,t.data.y)).concat([t.data.color]))})),L.addHandler("clear-drawing-board",(function(t){_()})),L.addHandler("next-turn",(function(t){$("#cc-toolbox").css({transform:"translateX(-150%)"}),$("#player-container").css({transform:"translateX(0)"}),s.style.display="none",Z("/resources/end-turn.wav"),_(),ot(t.data.round,j.state.maxRounds),nt(t.data.players),o.innerHTML="",j.setState({roundEndTime:t.data.roundEndTime,allowDrawing:!1})})),L.addHandler("your-turn",(function(t){Z("/resources/your-turn.wav"),d.textContent=t.data[0],u.textContent=t.data[1],f.textContent=t.data[2],s.style.display="block",show("#word-dialog"),$("#cc-toolbox").css({transform:"translateX(0)"}),$("#player-container").css({transform:"translateX(-150%)"})})),window.setInterval((function(){var t=Math.floor((j.state.roundEndTime-(new Date).getTime())/1e3);r.innerText=t>=0?t:"∞"}),500),c.onclick=function(t){return L.sendStart(),hide("#start-dialog"),show("#word-dialog"),void(s.style.display="block")},d.onclick=function(t){return X(0)},u.onclick=function(t){return X(1)},f.onclick=function(t){return X(2)},E.style.backgroundColor=j.state.localColor,O.style.backgroundColor=j.state.localColor,S.style.backgroundColor=j.state.localColor,E.onclick=function(t){N(15),T(0)},O.onclick=function(t){N(30),T(1)},S.onclick=function(t){N(40),T(2)},j.registerHandler((function(t,e){var n=t.localLineWidth,o=t.localColor;if(o!=e.localColor){var a,r,l="#FFFFFF";o.startsWith("#")?(a=B(o),r=C(o),l=Math.sqrt(r.r*r.r*.299+r.g*r.g*.587+r.b*r.b*.114)>127.5?"rgb(0,0,0)":"rgb(255,255,255)"):a=o,console.log(a,l);var c=n;i.style.cursor='url(\'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" version="1.1" width="'.concat(c+2,'" height="').concat(c+2,'"><circle cx="').concat(c/2,'" cy="').concat(c/2,'" r="').concat(c/2,'" fill="').concat(a,'" stroke="').concat(l,"\"/></svg>') ").concat(c/2," ").concat(c/2,", auto")}})),v.onchange=function(t){return P(B(t.target.value))},Array.from(document.getElementsByClassName("color-button")).forEach((function(t){t.onclick=function(t){return P(t.target.style.backgroundColor)}})),k.onclick=function(t){return Y(0)},I.onclick=function(t){return Y(2)},w.onclick=function(t){return Y(1)},b.onclick=function(t){return _(),void L.sendClear()},j.registerHandler((function(t,e){var n,o=t.localTool;e.localTool!=o&&(n=o,k.className=0==n?"draw active":"draw",w.className=1==n?"erase active":"erase",I.className=2==n?"fill active":"fill")})),p.onsubmit=function(t){t.preventDefault(),L.sendMessage(m.value),m.value=""},L.open()})();
//# sourceMappingURL=game.js.map