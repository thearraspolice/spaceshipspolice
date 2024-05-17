import { global } from "./global.js";
import { settings } from "./settings.js";
import * as socketStuff from "./socketInit.js";
let { gui } = socketStuff;

class Canvas {
    constructor() {
        this.directionLock = false;
        this.target = global.target;
        this.socket = global.socket;
        this.directions = [];

        this.chatInput = document.getElementById('chatInput');
        this.chatInput.addEventListener('keydown', event => {
            if (![global.KEY_ENTER, global.KEY_ESC].includes(event.keyCode)) return;
            this.chatInput.blur();
            this.cv.focus();
            this.chatInput.hidden = true;
            if (!this.chatInput.value) return;
            if (event.keyCode === global.KEY_ENTER) this.socket.talk('M', this.chatInput.value);
            this.chatInput.value = "";
        });

        this.cv = document.getElementById('gameCanvas');
        this.cv.resize = (width, height) => {
            this.cv.width = this.width = width;
            this.cv.height = this.height = height;
        };
        this.cv.resize(innerWidth, innerHeight);
        this.reverseDirection = false;
        this.inverseMouse = false;
        this.spinLock = true;
        this.treeScrollSpeed = 0.5;
        this.treeScrollSpeedMultiplier = 1;
        global.canvas = this;
        if (global.mobile) {
            // Mobile
            let mobilecv = this.cv;
            this.controlTouch = null;
            this.movementTouch = null;
            this.movementTop = false;
            this.movementBottom = false;
            this.movementLeft = false;
            this.movementRight = false;
            mobilecv.addEventListener(
              "touchstart",
              (event) => this.touchStart(event),
              false
            );
            mobilecv.addEventListener(
              "touchmove",
              (event) => this.touchMove(event),
              false
            );
            mobilecv.addEventListener(
              "touchend",
              (event) => this.touchEnd(event),
              false
            );
            mobilecv.addEventListener(
              "touchcancel",
              (event) => this.touchEnd(event),
              false
            );
          } else {
            this.cv.addEventListener('mousemove', event => this.mouseMove(event), false);
            this.cv.addEventListener('mousedown', event => this.mouseDown(event), false);
            this.cv.addEventListener('mouseup', event => this.mouseUp(event), false);
            this.cv.addEventListener('keypress', event => this.keyPress(event), false);
            this.cv.addEventListener('keydown', event => this.keyDown(event), false);
            this.cv.addEventListener('keyup', event => this.keyUp(event), false);
            this.cv.addEventListener('wheel', event => this.wheel(event), false);
          }
    }
    wheel(event) {
        if (!global.died && global.showTree) {
            if (event.deltaY > 1) {
                global.treeScale /= 1.1;
            } else {
                global.treeScale *= 1.1;
            }
        }
    }
    keyPress(event) {
        switch (event.keyCode) {
            case global.KEY_ZOOM_OUT:
                if (!global.died && global.showTree) global.treeScale /= 1.1;
                break;
            case global.KEY_ZOOM_IN:
                if (!global.died && global.showTree) global.treeScale *= 1.1;
                break;
        }
    }
    keyDown(event) {
        if (global.specialPressed) {
            event.preventDefault();
            this.socket.talk("#", event.keyCode);
          } else {
        switch (event.keyCode) {
            case global.KEY_SHIFT:
                if (global.showTree) this.treeScrollSpeedMultiplier = 5;
                else this.socket.cmd.set(6, true);
                break;

            case global.KEY_ENTER:
                // Enter to respawn
                if (global.died) {
                    this.socket.talk('s', global.playerName, 0, 1 * settings.game.autoLevelUp);
                    global.died = false;
                    break;
                }

                // or to talk instead
                if (this.chatInput.hidden && global.gameStart) {
                    this.chatInput.hidden = false;
                    this.chatInput.focus();
                    break;
                }
                break;

            case global.KEY_UP_ARROW:
                if (!global.died && global.showTree) return global.scrollVelocityY = -this.treeScrollSpeed * this.treeScrollSpeedMultiplier;
            case global.KEY_UP:
                this.socket.cmd.set(0, true);
                break;
            case global.KEY_DOWN_ARROW:
                if (!global.died && global.showTree) return global.scrollVelocityY = +this.treeScrollSpeed * this.treeScrollSpeedMultiplier;
            case global.KEY_DOWN:
                this.socket.cmd.set(1, true);
                break;
            case global.KEY_LEFT_ARROW:
                if (!global.died && global.showTree) return global.scrollVelocityX = -this.treeScrollSpeed * this.treeScrollSpeedMultiplier;
            case global.KEY_LEFT:
                this.socket.cmd.set(2, true);
                break;
            case global.KEY_RIGHT_ARROW:
                if (!global.died && global.showTree) return global.scrollVelocityX = +this.treeScrollSpeed * this.treeScrollSpeedMultiplier;
            case global.KEY_RIGHT:
                this.socket.cmd.set(3, true);
                break;
            case global.KEY_MOUSE_0:
                this.socket.cmd.set(4, true);
                break;
            case global.KEY_MOUSE_1:
                this.socket.cmd.set(5, true);
                break;
            case global.KEY_MOUSE_2:
                this.socket.cmd.set(6, true);
                break;
            case global.KEY_LEVEL_UP:
                this.socket.talk('L');
                break;
            case global.KEY_FUCK_YOU:
                this.socket.talk('0');
                break;
            case global.KEY_BECOME:
                this.socket.talk('H');
                break;
            case global.KEY_MAX_STAT:
                global.statMaxing = true;
                break;
            case global.KEY_SUICIDE:
                this.socket.talk('1');
                break;
            case global.KEY_BAN:
                this.socket.talk("ban");
                break;
        }
        if (!event.repeat) {
            switch (event.keyCode) {
                case global.KEY_SPECIAL:
                    this.socket.talk("#");
                    global.specialPressed = true;
                    break;
                case global.KEY_AUTO_SPIN:
                    global.autoSpin = !global.autoSpin;
                    this.socket.talk('t', 0);
                    break;
                case global.KEY_AUTO_FIRE:
                    this.socket.talk('t', 1);
                    break;
                case global.KEY_OVER_RIDE:
                    this.socket.talk('t', 2);
                    break;
                case global.KEY_REVERSE_MOUSE: //client side only, no server effects except message
                    this.inverseMouse = !this.inverseMouse;
                    this.socket.talk('t', 3);
                    break;
                case global.KEY_REVERSE_TANK: //client side only, no server effects except message
                    this.reverseDirection = !this.reverseDirection;
                    this.socket.talk('t', 4);
                    break;
                case global.KEY_AUTO_ALT:
                    this.socket.talk('t', 5);
                    break;
                case global.KEY_SPIN_LOCK:
                    this.spinLock = !this.spinLock;
                    this.socket.talk('t', 6);
                    break;
                case global.KEY_CLASS_TREE:
                    global.treeScale = 1;
                    global.showTree = !global.showTree;
                    break;
            }
            if (global.canSkill) {
                let skill = [
                    global.KEY_UPGRADE_ATK, global.KEY_UPGRADE_HTL, global.KEY_UPGRADE_SPD,
                    global.KEY_UPGRADE_STR, global.KEY_UPGRADE_PEN, global.KEY_UPGRADE_DAM,
                    global.KEY_UPGRADE_RLD, global.KEY_UPGRADE_MOB, global.KEY_UPGRADE_RGN,
                    global.KEY_UPGRADE_SHI
                ].indexOf(event.keyCode);
                if (skill >= 0) this.socket.talk('x', skill, 1 * global.statMaxing);
            }
            if (global.canUpgrade) {
                switch (event.keyCode) {
                    case global.KEY_CHOOSE_1:
                        this.socket.talk('U', 0);
                        break;
                    case global.KEY_CHOOSE_2:
                        this.socket.talk('U', 1);
                        break;
                    case global.KEY_CHOOSE_3:
                        this.socket.talk('U', 2);
                        break;
                    case global.KEY_CHOOSE_4:
                        this.socket.talk('U', 3);
                        break;
                    case global.KEY_CHOOSE_5:
                        this.socket.talk('U', 4);
                        break;
                    case global.KEY_CHOOSE_6:
                        this.socket.talk('U', 5);
                        break;
                }
            }
        }
      }
    }
    keyUp(event) {
        switch (event.keyCode) {
            case global.KEY_SPECIAL:
                global.specialPressed = false;
                break;
            case global.KEY_SHIFT:
                if (global.showTree) this.treeScrollSpeedMultiplier = 1;
                else this.socket.cmd.set(6, false);
                break;
            case global.KEY_UP_ARROW:
                global.scrollVelocityY = 0;
            case global.KEY_UP:
                this.socket.cmd.set(0, false);
                break;
            case global.KEY_DOWN_ARROW:
                global.scrollVelocityY = 0;
            case global.KEY_DOWN:
                this.socket.cmd.set(1, false);
                break;
            case global.KEY_LEFT_ARROW:
                global.scrollVelocityX = 0;
            case global.KEY_LEFT:
                this.socket.cmd.set(2, false);
                break;
            case global.KEY_RIGHT_ARROW:
                global.scrollVelocityX = 0;
            case global.KEY_RIGHT:
                this.socket.cmd.set(3, false);
                break;
            case global.KEY_MOUSE_0:
                this.socket.cmd.set(4, false);
                break;
            case global.KEY_MOUSE_1:
                this.socket.cmd.set(5, false);
                break;
            case global.KEY_MOUSE_2:
                this.socket.cmd.set(6, false);
                break;
            case global.KEY_MAX_STAT:
                global.statMaxing = false;
                break;
        }
    }
    mouseDown(mouse) {
        if (!this.socket) return;
        let primaryFire = 4,
            secondaryFire = 6;
        if (this.inverseMouse) [primaryFire, secondaryFire] = [secondaryFire, primaryFire];
        switch (mouse.button) {
            case 0:
                let mpos = {
                    x: mouse.clientX * global.ratio,
                    y: mouse.clientY * global.ratio,
                };
                let statIndex = global.clickables.stat.check(mpos);
                if (statIndex !== -1) {
                    this.socket.talk('x', statIndex, 1 * global.statMaxing);
                } else if (global.clickables.skipUpgrades.check(mpos) !== -1) {
                    global.clearUpgrades();
                } else {
                    let upgradeIndex = global.clickables.upgrade.check(mpos);
                    if (upgradeIndex !== -1) this.socket.talk('U', upgradeIndex);
                    else this.socket.cmd.set(primaryFire, true);
                }
                break;
            case 1:
                this.socket.cmd.set(5, true);
                break;
            case 2:
                this.socket.cmd.set(secondaryFire, true);
                break;
        }
    }
    mouseUp(mouse) {
        if (!this.socket) return;
        let primaryFire = 4,
            secondaryFire = 6;
        if (this.inverseMouse) [primaryFire, secondaryFire] = [secondaryFire, primaryFire];
        switch (mouse.button) {
            case 0:
                this.socket.cmd.set(primaryFire, false);
                break;
            case 1:
                this.socket.cmd.set(5, false);
                break;
            case 2:
                this.socket.cmd.set(secondaryFire, false);
                break;
        }
    }
    mouseMove(mouse) {
        global.statHover =
          global.clickables.hover.check({
            x: mouse.clientX * global.ratio,
            y: mouse.clientY * global.ratio,
          }) === 0;
        if (!this.spinLock) return;
        if (global.mobile) {
          this.target.x = mouse.clientX * global.ratio - this.width / 2;
          this.target.y = mouse.clientY * global.ratio - this.height / 2;
          if (this.reverseDirection) {
            this.target.x *= -1;
            this.target.y *= -1;
          }
          this.target.x *= window.innerWidth / this.width;
          this.target.y *= window.innerHeight / this.height;
        } else {
          if (!global.gameStart) return;
          global.mouse.x = mouse.clientX * global.ratio;
          global.mouse.y = mouse.clientY * global.ratio;
        }
      }
      touchEnd(e) {
        e.preventDefault();
        for (let touch of e.changedTouches) {
          let mpos = { x: touch.clientX, y: touch.clientY };
          let id = touch.identifier;
    
          if (this.movementTouch === id) {
            this.movementTouch = null;
            if (this.movementTop)
              this.socket.cmd.set(0, (this.movementTop = false));
            if (this.movementBottom)
              this.socket.cmd.set(1, (this.movementBottom = false));
            if (this.movementLeft)
              this.socket.cmd.set(2, (this.movementLeft = false));
            if (this.movementRight)
              this.socket.cmd.set(3, (this.movementRight = false));
          } else if (this.controlTouch === id) {
            this.controlTouch = null;
            this.socket.cmd.set(4, false);
          }
        }
      }
      touchStart(e) {
        e.preventDefault();
        if (global.died) {
            this.socket.talk(
              "s",
              global.playerName,
              0,
              1 * settings.game.autoLevelUp
            );
            global.autoSpin = false;
            global.died = false;
        } else {
            for (let touch of e.changedTouches) {
                let mpos = {
                  x: touch.clientX * global.ratio,
                  y: touch.clientY * global.ratio,
                };
                let id = touch.identifier;
          
                let buttonIndex = global.clickables.mobileButtons.check(mpos);
                if (buttonIndex !== -1) [
                    () => global.clickables.mobileButtons.active = !global.clickables.mobileButtons.active,
                    () => { global.clickables.mobileButtons.altFire = !global.clickables.mobileButtons.altFire; },
                    () => { if(!document.fullscreenElement) {
                              var d = document.body;
                  d.requestFullscreen
                    ? d.requestFullscreen()
                    : d.msRequestFullscreen
                    ? d.msRequestFullscreen()
                    : d.mozRequestFullScreen
                    ? d.mozRequestFullScreen()
                    : d.webkitRequestFullscreen && d.webkitRequestFullscreen();
                    } else { 
                      document.exitFullscreen() 
                    }  },
                    () => this.socket.talk('t', 1),
                    () => { this.reverseDirection = !this.reverseDirection; global.reverseTank = !global.reverseTank; this.socket.talk('t', 4); },
                    () => this.socket.talk('1'),
                    () => { global.autoSpin = !global.autoSpin; this.socket.talk('t', 0); },
                    () => this.socket.talk('t', 2),
                    () => this.socket.talk('L'),
                    () => this.socket.talk('H'),
                    /*() => this.socket.talk('0'),*/
                    () => { if (this.chatInput.hidden && global.gameStart) { this.chatInput.hidden = false; this.chatInput.focus(); } else { this.chatInput.hidden = true; this.cv.focus(); } },
                    () => this.socket.cmd.set(6, !this.socket.cmd.get(6)),
                  ][buttonIndex]();
                else {
                let statIndex = global.clickables.stat.check(mpos);
                if (statIndex !== -1) this.socket.talk("x", statIndex);
                else if (global.clickables.skipUpgrades.check(mpos) !== -1)
                  global.clearUpgrades();
                else {
                  let upgradeIndex = global.clickables.upgrade.check(mpos);
                  if (upgradeIndex !== -1) this.socket.talk("U", upgradeIndex);
                  else {
                    let onLeft = mpos.x < this.cv.width / 2;
                    if (this.movementTouch === null && onLeft) {
                      this.movementTouch = id;
                    } else if (this.controlTouch === null && !onLeft) {
                      this.controlTouch = id;
                      this.socket.cmd.set(4, true);
                    }
                  }
                }
                }
              }
        }
        this.touchMove(e);
      }
      touchMove(e) {
        e.preventDefault();
        for (let touch of e.changedTouches) {
          let mpos = {
            x: touch.clientX * global.ratio,
            y: touch.clientY * global.ratio,
          };
          let id = touch.identifier;
    
          if (this.movementTouch === id) {
            let x = mpos.x - (this.cv.width * 1) / 6;
            let y = mpos.y - (this.cv.height * 2) / 3;
            let norm = Math.sqrt(x * x + y * y);
            x /= norm;
            y /= norm;
            let amount = 0.38268323650898;
            if (y < -amount !== this.movementTop)
              this.socket.cmd.set(0, (this.movementTop = y < -amount));
            if (y > amount !== this.movementBottom)
              this.socket.cmd.set(1, (this.movementBottom = y > amount));
            if (x < -amount !== this.movementLeft)
              this.socket.cmd.set(2, (this.movementLeft = x < -amount));
            if (x > amount !== this.movementRight)
              this.socket.cmd.set(3, (this.movementRight = x > amount));
          } else if (this.controlTouch === id) {
           if (this.spinLock) this.target.x = (mpos.x - (this.cv.width * 5) / 6) * 4;
            if (this.spinLock) this.target.y = (mpos.y - (this.cv.height * 2) / 3) * 4;
          }
        }
        global.mouse = this.target;
      }
}
export { Canvas }
