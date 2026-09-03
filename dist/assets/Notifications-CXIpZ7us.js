import{c as e,A as t}from"./index-CmBDPG7H.js";/**
 * @license lucide-react v0.487.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const n=[["path",{d:"M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2",key:"1yyitq"}],["circle",{cx:"9",cy:"7",r:"4",key:"nufk8"}],["line",{x1:"19",x2:"19",y1:"8",y2:"14",key:"1bvyxn"}],["line",{x1:"22",x2:"16",y1:"11",y2:"11",key:"1shjgl"}]],i=e("user-plus",n),c=async()=>(await t.get("/notifications")).data,r=async s=>(await t.put(`/notifications/${s}/read`)).data,y=async()=>(await t.put("/notifications/read-all")).data,d=async s=>(await t.delete(`/notifications/${s}`)).data;export{i as U,r as a,d,c as g,y as m};
