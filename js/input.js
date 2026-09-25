export class Input{
  constructor(){
    this.keyboard=new Set();this.gamepad=new Set();this.touches=new Map();this.pressed=new Set();
    addEventListener('keydown',e=>{if(!this.down(e.code))this.pressed.add(e.code);this.keyboard.add(e.code);if(['ArrowUp','ArrowDown','ArrowLeft','ArrowRight','Space'].includes(e.code))e.preventDefault()});
    addEventListener('keyup',e=>this.keyboard.delete(e.code));
    addEventListener('blur',()=>{this.keyboard.clear();this.gamepad.clear();this.touches.clear();this.pressed.clear()});
    document.querySelectorAll('#touch [data-key]').forEach(button=>{
      button.addEventListener('pointerdown',e=>{
        e.preventDefault();button.setPointerCapture?.(e.pointerId);this.setTouch(e.pointerId,button.dataset.key);
      });
      button.addEventListener('pointermove',e=>{
        if(!this.touches.has(e.pointerId))return;
        e.preventDefault();const target=document.elementFromPoint?.(e.clientX,e.clientY)?.closest?.('#touch [data-key]');
        const previous=this.touches.get(e.pointerId);
        // Deslizar entre esquerda e direita troca a direção sem levantar o dedo.
        if(['ArrowLeft','ArrowRight'].includes(previous)&&['ArrowLeft','ArrowRight'].includes(target?.dataset.key))this.setTouch(e.pointerId,target.dataset.key);
      });
      for(const type of ['pointerup','pointercancel','lostpointercapture'])button.addEventListener(type,e=>this.touches.delete(e.pointerId));
    });
  }
  setTouch(id,key){if(this.touches.get(id)===key)return;if(!this.down(key))this.pressed.add(key);this.touches.set(id,key)}
  down(...keys){return keys.some(key=>this.keyboard.has(key)||this.gamepad.has(key)||[...this.touches.values()].includes(key))}
  tap(...keys){const key=keys.find(k=>this.pressed.has(k));if(!key)return false;this.pressed.delete(key);return true}
  pollPad(){
    const p=navigator.getGamepads?.()[0];if(!p){this.gamepad.clear();return}
    const map=[['ArrowLeft',p.axes[0]<-.35||p.buttons[14]?.pressed],['ArrowRight',p.axes[0]>.35||p.buttons[15]?.pressed],['ArrowUp',p.axes[1]<-.35||p.buttons[12]?.pressed],['ArrowDown',p.axes[1]>.35||p.buttons[13]?.pressed],['KeyZ',p.buttons[0]?.pressed],['KeyX',p.buttons[1]?.pressed],['KeyC',p.buttons[2]?.pressed],['Escape',p.buttons[9]?.pressed]];
    for(const[key,on]of map){if(on){if(!this.down(key))this.pressed.add(key);this.gamepad.add(key)}else this.gamepad.delete(key)}
  }
  resetTouch(){this.touches.clear()}
  end(){this.pressed.clear()}
}
