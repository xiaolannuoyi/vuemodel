# vuemodel# Object.defineProperty
主要用到了Object.defineProperty(obj, prop, descriptor);
[Object.defineProperty](https://developer.mozilla.org/zh-CN/docs/Web/JavaScript/Reference/Global_Objects/Object/defineProperty)
## 数据描述符

configurable
:	当且仅当该属性的 configurable 为 true 时，该属性描述符才能够被改变，同时该属性也能从对应的对象上被删除。默认为 false。

enumerable
:	当且仅当该属性的enumerable为true时，该属性才能够出现在对象的枚举属性中。默认为 false。

value
:	该属性对应的值。可以是任何有效的 JavaScript 值（数值，对象，函数等）。默认为 undefined。

writable
:	当且仅当该属性的writable为true时，value才能被赋值运算符改变。默认为 false。

## 存取描述符

configurable
:	当且仅当该属性的 configurable 为 true 时，该属性描述符才能够被改变，同时该属性也能从对应的对象上被删除。默认为 false。

enumerable
:	当且仅当该属性的enumerable为true时，该属性才能够出现在对象的枚举属性中。默认为 false。

get
:	一个给属性提供 getter 的方法，如果没有 getter 则为 undefined。当访问该属性时，该方法会被执行，方法执行时没有参数传入，但是会传入this对象（由于继承关系，这里的this并不一定是定义该属性的对象）。
默认为 undefined。

set
:	一个给属性提供 setter 的方法，如果没有 setter 则为 undefined。当属性值修改时，触发执行该方法。该方法将接受唯一参数，即该属性新的参数值。
默认为 undefined。
# 总理流程图
![在这里插入图片描述](https://img-blog.csdnimg.cn/2018120121443644.png?x-oss-process=image/watermark,type_ZmFuZ3poZW5naGVpdGk,shadow_10,text_aHR0cHM6Ly9ibG9nLmNzZG4ubmV0L3FxXzMxMTI2MTc1,size_16,color_FFFFFF,t_70)

# 思路路程图


![在这里插入图片描述](https://img-blog.csdnimg.cn/20181202123112228.png?x-oss-process=image/watermark,type_ZmFuZ3poZW5naGVpdGk,shadow_10,text_aHR0cHM6Ly9ibG9nLmNzZG4ubmV0L3FxXzMxMTI2MTc1,size_16,color_FFFFFF,t_70)
mvvm.js
```js
class MVVM {
    constructor( options ) {
        //缓存重要属性
        this.$vm = this;
        this.$el = options.el;
        this.$data = options.data;

        //视图必须存在
        if( this.$el ) {
            //添加属性观察对象（实现数据挟持）
            new Observer( this.$data )
            //创建模板编译器，来解析视图
            this.$compiler = new TemplateCompiler(this.$el,this.$vm)
        }
    }
}
```

# Observer.js
```js
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
                //针对watcher创建时，直接完成订阅的添加
                var watcher = Dep.target;
                watcher && dep.addSub( watcher )
                return val;
            },
            //修改值
            set (newValue) {
                val = newValue;
                dep.notify()
            }
        })
    }
}

//创建订阅发布者
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
```
# TemplateCompiler  
![在这里插入图片描述](https://img-blog.csdnimg.cn/20181201233504398.png?x-oss-process=image/watermark,type_ZmFuZ3poZW5naGVpdGk,shadow_10,text_aHR0cHM6Ly9ibG9nLmNzZG4ubmV0L3FxXzMxMTI2MTc1,size_16,color_FFFFFF,t_70)

![在这里插入图片描述](https://img-blog.csdnimg.cn/20181202005030869.png?x-oss-process=image/watermark,type_ZmFuZ3poZW5naGVpdGk,shadow_10,text_aHR0cHM6Ly9ibG9nLmNzZG4ubmV0L3FxXzMxMTI2MTc1,size_16,color_FFFFFF,t_70)

TemplateCompiler .js
```js
//创建一个模板编译工具
class TemplateCompiler {
    constructor(el, vm) {
        //判断是不是元素节点,div.#app
        this.el = this.isElementNode(el) ? el : document.querySelector(el)
        this.vm = vm;
        if (this.el) {
            //将对应范围的html放入内存fragment
            var fragment = this.node2Fragment(this.el)
            // <span v-text="message"></span>
            // <input type="text" v-model="message">
            // {{message}}

            //编译模板
            this.compile(fragment)
            //将数据放回页面
            this.el.appendChild(fragment)
        }
    }

    /*********************工具方法**************************** */
    // 1	Element	元素名	null
    // 2	Attr	属性名称	属性值
    // 3	Text	#text	节点的内容
    // 4	CDATASection	#cdata-section	节点的内容
    // 5	EntityReference	实体引用名称	null
    // 6	Entity	实体名称	null
    // 7	ProcessingInstruction	target	节点的内容
    // 8	Comment	#comment	注释文本
    // 9	Document	#document	null
    // 10	DocumentType	文档类型名称	null
    // 11	DocumentFragment	#document 片段	null
    // 12	Notation	符号名称	null

    //是不是元素节点
    isElementNode(node) {
        return node.nodeType === 1
    }
    //判断文本节点
    isTextNode(node) {
        return node.nodeType === 3
    }
    //类似数组变数组
    toArray(fakeArr) {
        return [].slice.call(fakeArr)
    }
    //判断是不是指令属性
    isDirective(directiveName) {
        return directiveName.indexOf('v-') >= 0;
    }
    /*********************工具方法**************************** */

    //吧模板放入内存
    node2Fragment(node) { //div#app
        var fragment = document.createDocumentFragment();//创建一个新的空白的文档片段
        var child;
        while (child = node.firstChild) {
            fragment.appendChild(child) //如果文档树中已经存在了 newchild，它将从文档树中删除，然后重新插入它的新位置。
        }
        return fragment;
        //<span v-text="message"></span>
        // <input type="text" v-model="message">
        // {{message}}

    }
    //编译模板方法
    compile(parent) {
        // parent
        // <span v-text="message"></span>
        // <input type="text" v-model="message">
        // {{message}}
        var childNodes = parent.childNodes;
        var arr = this.toArray(childNodes) // 类似数组nodelist转出真正的数组
        arr.forEach(node => {
            //元素节点，解析指令
            if (this.isElementNode(node)) {
                this.compileElement(node);
            } else {//文本节点
                //定义文本表达式验证规则
                var textReg = /\{\{(.+)\}\}/;
                var expr = node.textContent;//textContent 属性设置或返回指定节点的文本内容，以及它的所有后代。
                if (textReg.test(expr)) {
                    //var key = textReg.exec( expr )[1]
                    expr = RegExp.$1; //{{}}里面的内容
                    //调用方法编译
                    this.compileText(node, expr)
                }

            }

        });
    }
    //解析元素节点
    compileElement(node) {
        //<span v-text="message"></span>
        // v-text
        var arrs = node.attributes;
        //遍历当前元素所有属性
        this.toArray(arrs).forEach(attr => {
            var attrName = attr.name;
            if (this.isDirective(attrName)) { //判断是否存在指令属性 v- 
                //获取v-text的text
                var type = attrName.split('-')[1]
                var expr = attr.value;
                CompilerUtils[type] && CompilerUtils[type](node, this.vm, expr)
            }
        })

    }
    //解析文本节点
    compileText(node, expr) {
        CompilerUtils.text(node, this.vm, expr)
    }
}
CompilerUtils = {
    /*******解析v-text指令时候只执行一次，但是里面的更新数据方法会执行n多次*********/
    text(node, vm, expr) {
        /*第一次*/
        var updateFn = this.updater.textUpdater;
        updateFn && updateFn(node, vm.$data[expr])

        /*第n+1次 */
        new Watcher(vm, expr, (newValue) => {
            //发出订阅时候，按照之前的规则，对节点进行更新
            updateFn && updateFn(node, newValue)
        })
    },
    /*******解析v-model指令时候只执行一次，但是里面的更新数据方法会执行n多次*********/
    model(node, vm, expr) {
        var updateFn = this.updater.modelUpdater;
        updateFn && updateFn(node, vm.$data[expr])

        /*第n+1次 */
        new Watcher(vm, expr, (newValue) => {
            //发出订阅时候，按照之前的规则，对节点进行更新
            updateFn && updateFn(node, newValue)
        })

        //视图到模型(观察者模式)
        node.addEventListener('input', (e) => {
            //获取新值放到模型
            var newValue = e.target.value;
            vm.$data[expr] = newValue;
        })
    },
    updater: {
        //v-text数据回填
        textUpdater(node, value) {
            node.textContent = value;
        },
        //v-model数据回填
        modelUpdater(node, value) {
            node.value = value;
        }
    }
}
```
watcher.js
```js
//声明一个订阅者
class Watcher{
    //node 订阅的节点
    //vm 全局vm对象
    //cb 发布时需要做事情
    constructor ( vm, expr, cb ) {
        //缓存重要属性
        this.vm = vm;
        this.expr = expr;
        this.cb = cb;

        //缓存当前值
        this.value = this.get()

    }
    get () {
        //把当前订阅者添加到全局
        Dep.target = this;
        //获取当前值
        var value = this.vm.$data[this.expr]
        //清空全局
        Dep.target = null;
        return value;
    }
    //提供更新方法，应对发布后
    update () {
        //获取新值
        var newValue = this.vm.$data[this.expr]
        //获取老值
        var old = this.value;

        //判断后
        if(newValue !== old){
            //执行回调
            this.cb(newValue)
        }
            
    }
}
```
[完整项目地址](https://github.com/xiaolannuoyi/vuemodel.git)



