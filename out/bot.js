Zilch.Bot=class y{params;lastPaddleY=0;lastBallX=0;lastBallY=0;lastBallComingTowardPaddle=!1;hasHitBall=!1;moveTowardNet=!1;constructor(e){this.params=e}static start(e){return new y(e)}move(e){let s=p(e),l=this.params.botIndex===0,t=l?s.p1:s.p2,o={x:s.ball.x-this.lastBallX,y:s.ball.y-this.lastBallY},n=l?o.x<0:o.x>0;!n&&this.lastBallComingTowardPaddle&&(this.hasHitBall=!0);let a="none";if(this.params.type==="practice")if(Math.random()<.5&&this.hasHitBall){let r=["south","north","east","west"];a=r[Math.floor(Math.random()*r.length)]}else Math.abs(s.ball.y-t.y)<2?a="none":s.ball.y<t.y?a="south":a="north";else if(this.params.type==="boss-easy")Math.abs(s.ball.y-t.y)<2?a="none":s.ball.y<t.y?a="south":a="north";else if(this.params.type==="boss-medium")n?Math.abs(t.y-s.ball.y)<1?(l?t.x<-5:t.x>5)?a=l?"west":"east":a="none":t.y>s.ball.y?a="south":a="north":Math.abs(t.y)>2?a=t.y>0?"south":"north":Math.abs(t.x)<40?a=l?"east":"west":a="none";else if(this.params.type=="boss-hard")if(n){let r=o.x===0?0:-o.y/o.x,i=s.ball.x*r+s.ball.y,h=-r*t.x+i;this.moveTowardNet=Math.random()>.4,Math.abs(h-t.y)<1?a="none":h<t.y?a="south":h>t.y?a="north":a="none"}else t.y>1?a="south":t.y<-1?a="north":!this.moveTowardNet&&Math.abs(t.x)<38?a=l?"east":"west":this.moveTowardNet&&Math.abs(t.x)>20?a=l?"west":"east":a="none";return this.lastBallComingTowardPaddle=n,this.lastBallX=s.ball.x,this.lastBallY=s.ball.y,this.lastPaddleY=t.y,a}end(e){}};function p(m){let e=m.split(",");if(e.length!==6)throw new Error("Unexpected payload");let[s,l,t,o,n,a]=e.map(r=>{let i=parseFloat(r);if(isNaN(i))throw new Error("Unexpected payload");return i});return{p1:{x:s,y:l},p2:{x:t,y:o},ball:{x:n,y:a}}}
//# sourceMappingURL=bot.js.map
