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