const KEY='ironFurySaveV1';
export const defaults={unlocked:1,coins:0,highScore:0,completed:[],upgrades:{health:0,damage:0,grenades:0,armor:0},settings:{difficulty:'normal',screenShake:true},achievements:[],selectedCharacter:'brutus',characters:{unlocked:['brutus','nina'],cleared:[],progress:{brutus:1,nina:1}}};
export function load(){try{const saved=JSON.parse(localStorage.getItem(KEY)||'{}');return {...defaults,...saved,characters:{...defaults.characters,...(saved.characters||{})}}}catch{return structuredClone(defaults)}}
export function save(data){localStorage.setItem(KEY,JSON.stringify(data))}
export function reset(){localStorage.removeItem(KEY)}
