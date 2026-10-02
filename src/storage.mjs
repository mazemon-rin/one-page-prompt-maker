const KEY='one-page-prompt-maker-ver01';
export function load(){try{return JSON.parse(localStorage.getItem(KEY))||{draft:null,projects:[],history:[]}}catch{return{draft:null,projects:[],history:[]}}}
export function save(data){localStorage.setItem(KEY,JSON.stringify(data))}
export function exportData(){return{schemaVersion:1,app:'one-page-prompt-maker',exportedAt:new Date().toISOString(),...load()}}
export function importData(payload){if(!payload||payload.app!=='one-page-prompt-maker'||payload.schemaVersion!==1)throw new Error('このアプリのバックアップではありません');save({draft:payload.draft||null,projects:payload.projects||[],history:payload.history||[]})}
export const DB_NAME=KEY;
