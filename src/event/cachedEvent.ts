import Event from './Event'

export class CachedEvent extends Event {
  cache: Map<string, Array<any>>

  constructor() {
    super()
    this.cache = new Map()
  }

  on(eventName: string, listener: (...args: any[]) => any) {
    super.on(eventName, listener)

    // 检查缓存中是否有提前 emit 的事件
    let cachedEvents = this.cache.get(eventName)
    if (cachedEvents) {
      for (let args of cachedEvents) {
        listener(...args)
      }
      this.cache.delete(eventName)
    }
  }

  emit(eventName: string, ...args: any[]) {
    super.emit(eventName, ...args)

    // 如果没有监听器，将事件保存到缓存中
    if (!this.listeners.has(eventName)) {
      let cachedEvents = this.cache.get(eventName)
      if (!cachedEvents) this.cache.set(eventName, cachedEvents = [])
      cachedEvents.push(args)
    }
  }
  launchFilePathUpdated(path:string){
    this.emit('launchFilePathUpdated', path)
  }

}
// type EventMethods = Omit<EventType, keyof Event>
//
// declare class EventType extends CachedEvent {
//   on<K extends keyof EventMethods>(event: K, listener: EventMethods[K]): any
//   off<K extends keyof EventMethods>(event: K, listener: EventMethods[K]): any
// }

export const createCachedEventHub = (): CachedEvent => {
  return new CachedEvent()
}

