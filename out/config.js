var r={type:"object",required:["serveTo"],properties:{serveTo:{description:"The direction the ball will start moving at the beginning of the game.",enum:["east","west","random"]}}};Zilch.configSchema=r;Zilch.configPresets=[{name:"Standard",value:`{
  // Serve to "east" or "west" paddle or "random"
  "serveTo": "random"
}
`}];Zilch.parseConfig=e=>({serveTo:e.serveTo});Zilch.serializeConfig=e=>e.serveTo.toString();Zilch.summarizeConfig=e=>`serve to ${e.serveTo} paddle`;
//# sourceMappingURL=config.js.map
