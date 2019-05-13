/*
精简版promse A+库，实现了promise构造函数，then,链式调用，all,race。
尚不能跑通规范的所有用例
*/

module.exports=class PromiseA {
    constructor(init) {
        this.PromiseStatus = 'pending';
        this.PromiseValue = null;
        this.reason = null;
        this.resolveCallback = [];
        this.rejectCallback = [];
        var resolve = (val) => {
            setTimeout(()=>{
                if(this.PromiseStatus != "pending"){return ;}
                this.PromiseValue = val;
                this.PromiseStatus = "fulfilled"
                if (this.resolveCallback) {
                    this.resolveCallback.forEach( (resolveFn) => {
                        if(resolveFn === val) { 
                            return reject(new TypeError('promise and x refer to the same object'));
                        }
                        var resolveResult=resolveFn(val);
                        let next = this.nextPromise;
                        if (resolveResult instanceof PromiseA) { //then方法返回了新的promise，

                            resolveResult.resolveCallback = next.resolveCallback;
                            resolveResult.rejectCallback = next.rejectCallback;
                        } else { //未返回新的promise,直接用返回值resolve
                            if (next != undefined && next.resolveCallback && next.resolveCallback != this.resolveCallback) { //非空检测，防重复调用
                                next.resolve(resolveResult);
                            }
                        }
                    })
                }
            })
        }
        var reject = (reason) => {
            setTimeout(()=>{
                if(this.PromiseStatus != "pending"){return ;}
                if (this.rejectCallback) {
                    this.PromiseStatus = "rejected"
                    this.reason=reason;
                    this.rejectCallback.forEach( (rejectFn) => {
                        rejectFn(reason)
                    });
                }

            })
        }
        this.resolve=resolve;
        this.reject=reject;
      
        if (init) {
            init(resolve, reject);
        }
    }
    then(onFulfill, onReject) {
        if(typeof onFulfill!="function"){
            onFulfill=function(value) {return value;};
        }
        if(typeof onReject!="function"){
            onReject=function(err) {throw err;}
        }
        this.resolveCallback.push(onFulfill);
        this.rejectCallback.push(onReject);
        var promise = new PromiseA();//创建一个新的promise实例
        this.nextPromise = promise;//保存一下新的promise引用，便于链式调用
        if (this.PromiseStatus == "fulfilled") { //如果是已经fulfilled的promise，立即执行
            this.resolve(this.PromiseValue);
        } else if (this.PromiseStatus == "rejected"){
            this.reject(this.reason);
        }

        return promise;
    }
    catch(onRejected) {
        return this.then(null, onRejected);
    }
    static all(list) {
        return new PromiseA(function (resolve) {
            var results = new Array(list.length);
            var completeCount = 0;
            list.forEach((promise, index) => {
                promise.then((val) => {
                    results[index] = val;
                    completeCount++;
                    if (completeCount == list.length) {
                        resolve(results);
                    }
                })
            })
        })
    }
    static race(list) {
        return new PromiseA(function (resolve) {
            list.forEach((promise) => {
                promise.then((val) => {
                    resolve(val);
                })
            })
        });
    }
}