 //创建观察对象
 class Observer{
    constructor (data) {
        //提供一个解析方法，完成属性的分析和挟持
        this.observe( data )
    }
    //解析数据，完成对数据属性的挟持，控制对象属性的get和set
    observe (data) {
        //判断数据的有效性（必须是对象）
        if(!data || typeof data !== 'object'){
            return 
        }else{
            
            var keys = Object.keys(data)
            keys.forEach((key)=>{
                this.defineReactive(data,key,data[key])
            })
        }
        //真对当前对象的属性的重新定义


    }
    defineReactive (obj,key,val) {
        var dep = new Dep()
        Object.defineProperty(obj,key,{
            //是否可遍历
            enumerable : true,
            //是否可配置
            configurable : false,
            //取值方法
            get () {
                //真对watcher创建时，将订阅添加到订阅管理者
                //由于需要在闭包内添加watcher，所以通过Dep定义一个全局target属性，暂存watcher, 添加完移除
                var watcher = Dep.target;
                watcher && dep.addSub( watcher )
                return val;
            },
            //修改值
            set (newValue) {
                val = newValue;
                //集体通知
                dep.notify()
            }
        })
    }
}

//订阅管理者
    //1.管理订阅
    //2.集体通知
class Dep{
    constructor(){
        this.subs = [];
    }
    //添加订阅
    addSub (sub) {//sub就是watcher对象
        this.subs.push(sub)
    }
    //集体通知
    notify () {
        this.subs.forEach((sub)=>{
            sub.update()
        })
    }
}