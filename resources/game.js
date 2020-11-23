(()=>{"use strict";var e={d:(t,n)=>{for(var o in n)e.o(n,o)&&!e.o(t,o)&&Object.defineProperty(t,o,{enumerable:!0,get:n[o]})},o:(e,t)=>Object.prototype.hasOwnProperty.call(e,t),r:e=>{"undefined"!=typeof Symbol&&Symbol.toStringTag&&Object.defineProperty(e,Symbol.toStringTag,{value:"Module"}),Object.defineProperty(e,"__esModule",{value:!0})}},t={};e.r(t),e.d(t,{clear:()=>_,drawLine:()=>U,fill:()=>J});var n=document.getElementById("player-container"),o=document.getElementById("word-container"),a=document.getElementById("rounds"),r=document.getElementById("time-left"),i=document.getElementById("drawing-board"),l=document.getElementById("start-dialog"),c=document.getElementById("start-game-button"),s=document.getElementById("word-dialog"),d=document.getElementById("word-button-zero"),u=document.getElementById("word-button-one"),f=document.getElementById("word-button-two"),g=function(){return window.baseWidth/i.clientWidth},h=function(){return i.clientWidth/window.baseWidth},y=function(){for(var e=arguments.length,t=new Array(e),n=0;n<e;n++)t[n]=arguments[n];return t.map((function(e){return e*h()}))},m=(document.getElementById("message-container"),document.getElementById("message-input")),p=document.getElementById("message-form"),v=document.getElementById("color-picker"),w=(document.getElementById("center-dialog"),document.getElementById("chat"),document.getElementById("erase-tool")),b=document.getElementById("clear-tool"),k=document.getElementById("draw-tool"),I=document.getElementById("fill-tool"),E=document.getElementById("small-circle"),O=document.getElementById("medium-circle"),T=document.getElementById("huge-circle"),S=function(e){E.className=0==e?"active":"",O.className=1==e?"active":"",T.className=2==e?"active":""};function C(e){var t=/^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(e);return t?{r:parseInt(t[1],16),g:parseInt(t[2],16),b:parseInt(t[3],16)}:null}function B(e){var t=C(e);return"rgb("+t.r+","+t.g+","+t.b+")"}function H(e,t){var n=Object.keys(e);if(Object.getOwnPropertySymbols){var o=Object.getOwnPropertySymbols(e);t&&(o=o.filter((function(t){return Object.getOwnPropertyDescriptor(e,t).enumerable}))),n.push.apply(n,o)}return n}function M(e){for(var t=1;t<arguments.length;t++){var n=null!=arguments[t]?arguments[t]:{};t%2?H(Object(n),!0).forEach((function(t){D(e,t,n[t])})):Object.getOwnPropertyDescriptors?Object.defineProperties(e,Object.getOwnPropertyDescriptors(n)):H(Object(n)).forEach((function(t){Object.defineProperty(e,t,Object.getOwnPropertyDescriptor(n,t))}))}return e}function x(e,t){for(var n=0;n<t.length;n++){var o=t[n];o.enumerable=o.enumerable||!1,o.configurable=!0,"value"in o&&(o.writable=!0),Object.defineProperty(e,o.key,o)}}function D(e,t,n){return t in e?Object.defineProperty(e,t,{value:n,enumerable:!0,configurable:!0,writable:!0}):e[t]=n,e}const j=new(function(){function e(){!function(e,t){if(!(e instanceof t))throw new TypeError("Cannot call a class as a function")}(this,e),D(this,"state",{allowDrawing:!1,localColor:"#000000",localLineWidth:5,localLineWidthUnscaled:5,localTool:0,ownID:null,ownerID:null,maxRounds:0,roundEndTime:0}),D(this,"handlers",[]),D(this,"_updating",!1)}var t,n;return t=e,(n=[{key:"setState",value:function(e){if(this._updating)console.error("cannot set state in state handlers");else{this._updating=!0;try{var t=M({},this.state);this.state=M(M({},this.state),e),console.log("prev state",t),console.log("next state",this.state),this._propagate(t)}catch(e){console.error(e)}this._updating=!1}}},{key:"_propagate",value:function(e){var t=this;this.handlers.map((function(n){return n(t.state,e)}))}},{key:"registerHandler",value:function(e){return this.handlers.push(e),function(){this.handlers.filter((function(t){return t!=e}))}}},{key:"reset",value:function(){var e=M({},this.state);this.state={},this.handlers=[],this._propagate(e)}}])&&x(t.prototype,n),e}());function W(e,t){for(var n=0;n<t.length;n++){var o=t[n];o.enumerable=o.enumerable||!1,o.configurable=!0,"value"in o&&(o.writable=!0),Object.defineProperty(e,o.key,o)}}const L=new(function(){function e(){var t,n,o=this;!function(e,t){if(!(e instanceof t))throw new TypeError("Cannot call a class as a function")}(this,e),n={},(t="handlers")in this?Object.defineProperty(this,t,{value:n,enumerable:!0,configurable:!0,writable:!0}):this[t]=n;var a="ws://"+location.hostname+":"+location.port+"/v1/ws?lobby_id="+window.lobbyId;this.socket=new ReconnectingWebSocket(a,null,{debug:!0,reconnectInterval:3e3,automaticOpen:!1}),this.socket.onmessage=function(e){var t=JSON.parse(e.data);void 0!==o.handlers[t.type]?o.handlers[t.type](t):console.error("socket received unknown message type "+t.type)},this.socket.onerror=function(e){return console.error("websocket error: ",e)}}var t,n;return t=e,(n=[{key:"open",value:function(){this.socket.open()}},{key:"addHandler",value:function(e,t){this.handlers[e]=t}},{key:"sendStart",value:function(){this.socket.send(JSON.stringify({type:"start"}))}},{key:"sendClear",value:function(){this.socket.send(JSON.stringify({type:"clear-drawing-board"}))}},{key:"sendMessage",value:function(e){this.socket.send(JSON.stringify({type:"message",data:e}))}},{key:"sendChooseWord",value:function(e){this.socket.send(JSON.stringify({type:"choose-word",data:e}))}},{key:"sendKickVote",value:function(e){this.socket.send(JSON.stringify({type:"kick-vote",data:e}))}},{key:"sendFill",value:function(e,t,n){this.socket.send(JSON.stringify({type:"fill",data:{x:e,y:t,color:n}}))}},{key:"sendLine",value:function(e,t,n,o,a,r){var i={type:"line",data:{fromX:e,fromY:t,toX:n,toY:o,color:a,lineWidth:r}};this.socket.send(JSON.stringify(i))}}])&&W(t.prototype,n),e}());function X(e){L.sendChooseWord(e),hide("#word-dialog"),s.style.display="none",$("#cc-toolbox").css({transform:"translateX(0)"}),$("#player-container").css({transform:"translateX(-150%)"}),j.setState({allowDrawing:!0})}function F(e,t,n,o){var a,r=j.state,i=r.localColor,l=r.localLineWidth;U(e,t,n,o,a=1===r.localTool?"#ffffff":i,l);var c=e*g(),s=t*g(),d=n*g(),u=o*g(),f=l*g();L.sendLine(c,s,d,u,a,f)}function P(e){var t;void 0===e?t=v.value:(e=function(e){if(/^#[0-9A-F]{6}$/i.test(e))return e;function t(e){return("0"+parseInt(e).toString(16)).slice(-2)}return"#"+t((e=e.match(/^rgb\((\d+),\s*(\d+),\s*(\d+)\)$/))[1])+t(e[2])+t(e[3])}(e),v.value=e,t=e),j.setState({localColor:t})}function N(e){j.setState({localLineWidthUnscaled:e,localLineWidth:e*h()})}function Y(e){0!==e&&1!==e&&2!==e||j.setState({localTool:e})}var R=i.getContext("2d");function A(){i.width=i.clientWidth,i.height=i.clientHeight,j.setState({localLineWidthUnscaled:j.state.localLineWidthUnscaled,localLineWidth:j.state.localLineWidthUnscaled*h()})}function _(){R.fillStyle="#FFFFFF",R.fillRect(0,0,i.width,i.height)}function J(e,t,n){R.fillStyle=n,R.fillFlood(e,t,1)}function U(e,t,n,o,a,r){e=Math.floor(e),t=Math.floor(t),n=Math.floor(n),o=Math.floor(o),r=Math.ceil(r),a=C(a);for(var i=function(e){for(var t=[],n=0;n<2*e;n++){t[n]=[];for(var o=0;o<2*e;o++){var a=Math.sqrt(Math.pow(e-n,2)+Math.pow(e-o,2));t[n][o]=a>e?0:a<e-2?2:1}}return t}(Math.floor(r/2)),l=Math.floor(i.length/2),c=R.getImageData(0,0,R.canvas.clientWidth,R.canvas.clientHeight),s=0;s<i.length;s++)for(var d=0;d<i[s].length;d++)(1===i[s][d]||e===n&&t===o&&2===i[s][d])&&V(c,e+s-l,t+d-l,n+s-l,o+d-l,a);R.putImageData(c,0,0)}function V(e,t,n,o,a,r){for(var i=Math.abs(o-t),l=Math.abs(a-n),c=t<o?1:-1,s=n<a?1:-1,d=i-l;;){if(t<0||t>=e.width||n<0||n>=e.height)return;if(q(e,t,n,r),t===o&&n===a)break;var u=2*d;u>-l&&(d-=l,t+=c),u<i&&(d+=i,n+=s)}}function q(e,t,n,o){var a=4*(n*e.width+t);e.data[a]=o.r,e.data[a+1]=o.g,e.data[a+2]=o.b,e.data[a+3]=255}A(),window.addEventListener("resize",A,!1);var z=!1,K=0,G=0,Q=0;function Z(e){var t=new Audio(e);t.type="audio/wav",t.play()}function ee(e){return function(e){if(Array.isArray(e))return te(e)}(e)||function(e){if("undefined"!=typeof Symbol&&Symbol.iterator in Object(e))return Array.from(e)}(e)||function(e,t){if(e){if("string"==typeof e)return te(e,t);var n=Object.prototype.toString.call(e).slice(8,-1);return"Object"===n&&e.constructor&&(n=e.constructor.name),"Map"===n||"Set"===n?Array.from(e):"Arguments"===n||/^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n)?te(e,t):void 0}}(e)||function(){throw new TypeError("Invalid attempt to spread non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method.")}()}function te(e,t){(null==t||t>e.length)&&(t=e.length);for(var n=0,o=new Array(t);n<t;n++)o[n]=e[n];return o}function ne(e){var t=j.state.ownID;n.innerHTML="",e.forEach((function(e){if(e.connected){e.state;var o='<div class="playerBox"> <img src="../resources/image/avatar_phillip.png" alt=""><div class="name';o+='">'+e.name+"</div>",e.id!==t&&(o+='<button class="kick-button" id="kick-button" type="button" title="Vote to kick this player" alt="Vote to kick this player" onclick="onClickKickButton('+e.id+')">👋</button>'),o+='<span class="score">'+e.score+"</span></div>",1===e.state?o+="<span>✏️</span>":2===e.state&&(o+="<span>✔️</span>"),o+="</div></div></div>";var a=document.createRange().createContextualFragment(o);n.appendChild(a)}}))}function oe(e,t){a.innerText="Round "+e+" of "+t}function ae(e){o.innerHTML="",e.forEach((function(e){if(0===e.character)o.innerHTML+='<span class="guess-letter guess-letter-underline">&nbsp;</span>';else{var t=String.fromCharCode(e.character);e.underline?o.innerHTML+='<span class="guess-letter guess-letter-underline">'+t+"</span>":o.innerHTML+='<span class="guess-letter">'+t+"</span>"}}))}i.ontouchstart=function(e){var t=j.state,n=t.allowDrawing,o=t.localTool;if(!z&&n&&(Q=e.touches[0].identifier,n&&2!==o)){var a=i.getBoundingClientRect();K=e.touches[0].clientX-a.left,G=e.touches[0].clientY-a.top,z=!0}},i.ontouchmove=function(e){var t=j.state.allowDrawing;if(e.preventDefault(),t&&z)for(var n=e.changedTouches.length-1;n>=0;n--)if(e.changedTouches[n].identifier===Q){var o=e.changedTouches[n],a=i.getBoundingClientRect(),r=o.clientX-a.left,l=o.clientY-a.top;return F(K,G,r,l),K=r,void(G=l)}},i.ontouchcancel=function(e){if(z)for(var t=e.changedTouches.length-1;t>=0;t--)if(e.changedTouches[t].identifier===Q)return void(z=!1)},i.ontouchend=i.ontouchcancel,i.onmousedown=function(e){var t=j.state,n=t.allowDrawing,o=t.localTool;return n&&0===e.button&&2!==o&&(K=e.offsetX,G=e.offsetY,z=!0),!1},window.onmouseup=function(e){!0===z&&(z=!1)},i.onmousemove=function(e){if(j.state.allowDrawing&&!0===z&&0===e.button){var t=i.getBoundingClientRect(),n=e.clientX-t.left,o=e.clientY-t.top;F(K,G,n,o),K=n,G=o}},i.onmouseenter=function(e){K=e.offsetX,G=e.offsetY},i.onclick=function(e){var t=j.state,n=t.allowDrawing,o=t.localTool;n&&0===e.button&&(2===o?function(e,t){J(e,t,j.state.localColor);var n=e*g(),o=t*g();L.sendFill(n,o,j.state.localColor)}(e.offsetX,e.offsetY):F(e.offsetX,e.offsetY,e.offsetX,e.offsetY),z=!1)},L.addHandler("ready",(function(e){var n,o=e.data;j.setState({ownerID:o.ownerId,allowDrawing:o.drawing,ownID:o.playerId,maxRounds:o.maxRounds,roundEndTime:o.roundEndTime}),oe(o.round,o.maxRounds),0===o.round&&o.ownerId===o.playerId&&(show("#start-dialog"),l.style.display="block"),o.players&&o.players.length&&ne(o.players),o.currentDrawing&&o.currentDrawing.length&&(n=o.currentDrawing,_(),n.forEach((function(e){var n=e.data;"fill"===e.type?J.apply(t,ee(y(n.x,n.y)).concat([n.color])):"line"===e.type?U.apply(t,ee(y(n.fromX,n.fromY,n.toX,n.toY)).concat([n.color,y(n.lineWidth)[0]])):console.log("Unknown draw element type: "+n.type)}))),o.wordHints&&o.wordHints.length&&ae(o.wordHints)})),L.addHandler("update-players",(function(e){ne(e.data)})),L.addHandler("correct-guess",(function(e){Z("/resources/plop.wav")})),L.addHandler("update-wordhint",(function(e){ae(e.data)})),L.addHandler("message",(function(e){messages.applyMessage("",e.data.author,e.data.content)})),L.addHandler("system-message",(function(e){messages.applyMessage("system-message","System",e.data)})),L.addHandler("non-guessing-player-message",(function(e){messages.applyMessage("non-guessing-player-message",e.data.author,e.data.content)})),L.addHandler("persist-username",(function(e){document.cookie="username="+e.data+";expires=Tue, 19 Jan 2038 00:00:00 UTC;path=/;samesite=strict"})),L.addHandler("reset-username",(function(e){document.cookie="username=; expires=Thu, 01 Jan 1970 00:00:00 GMT"})),L.addHandler("line",(function(e){U.apply(t,ee(y(e.data.fromX,e.data.fromY,e.data.toX,e.data.toY)).concat([e.data.color,y(e.data.lineWidth)[0]]))})),L.addHandler("fill",(function(e){J.apply(t,ee(y(e.data.x,e.data.y)).concat([e.data.color]))})),L.addHandler("clear-drawing-board",(function(e){_()})),L.addHandler("next-turn",(function(e){$("#cc-toolbox").css({transform:"translateX(-150%)"}),$("#player-container").css({transform:"translateX(0)"}),s.style.display="none",Z("/resources/end-turn.wav"),_(),oe(e.data.round,j.state.maxRounds),ne(e.data.players),o.innerHTML="",j.setState({roundEndTime:e.data.roundEndTime,allowDrawing:!1})})),L.addHandler("your-turn",(function(e){Z("/resources/your-turn.wav"),d.textContent=e.data[0],u.textContent=e.data[1],f.textContent=e.data[2],s.style.display="block",show("#word-dialog"),$("#cc-toolbox").css({transform:"translateX(0)"}),$("#player-container").css({transform:"translateX(-150%)"})})),window.setInterval((function(){var e=Math.floor((j.state.roundEndTime-(new Date).getTime())/1e3);r.innerText=e>=0?e:"∞"}),500),c.onclick=function(e){return L.sendStart(),hide("#start-dialog"),show("#word-dialog"),void(s.style.display="block")},d.onclick=function(e){return X(0)},u.onclick=function(e){return X(1)},f.onclick=function(e){return X(2)},E.style.backgroundColor=j.state.localColor,O.style.backgroundColor=j.state.localColor,T.style.backgroundColor=j.state.localColor,E.onclick=function(e){N(15),S(0)},O.onclick=function(e){N(30),S(1)},T.onclick=function(e){N(40),S(2)},j.registerHandler((function(e,t){var n=e.localLineWidth,o=e.localColor;if(o!=t.localColor){var a,r,l="#FFFFFF";o.startsWith("#")?(a=B(o),r=C(o),l=Math.sqrt(r.r*r.r*.299+r.g*r.g*.587+r.b*r.b*.114)>127.5?"rgb(0,0,0)":"rgb(255,255,255)"):a=o,console.log(a,l);var c=n;i.style.cursor='url(\'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" version="1.1" width="'.concat(c+2,'" height="').concat(c+2,'"><circle cx="').concat(c/2,'" cy="').concat(c/2,'" r="').concat(c/2,'" fill="').concat(a,'" stroke="').concat(l,"\"/></svg>') ").concat(c/2," ").concat(c/2,", auto")}})),v.onchange=function(e){return P(B(e.target.value))},Array.from(document.getElementsByClassName("color-button")).forEach((function(e){e.onclick=function(e){return P(e.target.style.backgroundColor)}})),k.onclick=function(e){return Y(0)},I.onclick=function(e){return Y(2)},w.onclick=function(e){return Y(1)},b.onclick=function(e){return _(),void L.sendClear()},j.registerHandler((function(e,t){var n,o=e.localTool;t.localTool!=o&&(n=o,k.className=0==n?"draw active":"draw",w.className=1==n?"erase active":"erase",I.className=2==n?"fill active":"fill")})),p.onsubmit=function(e){e.preventDefault(),L.sendMessage(m.value),m.value=""},L.open()})();
//# sourceMappingURL=game.js.map