//创建一个中介div
var objE;
function createTempUl(){
  objE = document.createElement("ul");
  objE.style.position = 'absolute';
  objE.style.top = 0;
  objE.style.left = 0;
  objE.style.zIndex = -100;
  objE.style.opacity = 0;
  document.body.appendChild(objE);
  return objE;
}

function query (el){
  if (typeof el === 'string') {
    const selected = document.querySelector(el)
    if (!selected) {
      return document.createElement('div')
    }
    return selected
  } else {
    return el
  }
}

function getStyle(element, attr) {
  if(element.currentStyle) {
    return element.currentStyle[attr];
  } else {
    return getComputedStyle(element, false)[attr];
  }
}

function getEleHeight(el){
  return el.offsetHeight;
}
// dom字符串解析
function parseDom(arg) {
　objE.innerHTML = arg;
　return objE.childNodes;
};

/**
 * 
 * @param {
 *  itemModel : function return a htmlModel
 *  el: string || element
 *  listData: str
 * } option 
 * 
 */
function InfinityScroll(option){

  this.el // 当前元素
  this.itemModel // item回调函数
  this.listData // listData
  this._warpHeight // 容器元素高度
  this._itemHeight // 子元素高度
  this._limit // 每屏渲染数目
  this._contentLi // 所有渲染子元素数组
  this._topGuard // 头部撑开高度元素
  this._tailGuard // 尾部撑开高度元素

  this.init(option);
}

const init = function(option){
  this.el = query(option.el);
  this.itemModel = option.itemModel;
  this.listData = option.listData;
  
  
  // 防止不设置不滚动
  this.el.style.overflow = 'auto';
  this.setWarpHeight();


  if(!this.listData || this.listData.length === 0)return;
  this.firstRender();
  this.initScrollLisener();
}
//第一次
const firstInit = function(option){
  createTempUl();
  init.call(this,option);
  InfinityScroll.prototype.init = init;
}

// 相应初始化
InfinityScroll.prototype.init = firstInit;

InfinityScroll.prototype.setWarpHeight = function(){
  this._warpHeight = getEleHeight(this.el);
}

InfinityScroll.prototype.setItemWidth = function(el){
  this._itemHeight = getEleHeight(el);
  // + 4是为了上下各预留一个预备元素
  this._limit = Math.ceil(this._warpHeight / this._itemHeight) + 4;
}

// 根据当前视口创建相应数量dom
InfinityScroll.prototype.createItemDom = function(data, index){ 
  return parseDom(this.itemModel(data, index))[0];
}

InfinityScroll.prototype.firstRender = function(){
  // 清空html
  this.el.innerHTML = ''; 
  var oDocumentFeagment = document.createDocumentFragment();//创建documenFragment
  var _this = this;
  this._contentLi = [];
  // 首次渲染列表，计算出当前属性
  const firstEl = this.createItemDom(this.listData[0], 0);
  this.setItemWidth(firstEl);
  oDocumentFeagment.append(firstEl);
  // 存入所有展示的元素
  this._contentLi.push(firstEl);

  //渲染出若干条
  this.listData.slice(1,this._limit).forEach(function(data, index){
    var itemEl =  _this.createItemDom(data, index + 1);
    oDocumentFeagment.append(itemEl);
    _this._contentLi.push(itemEl);
  })
  
  this.el.append(oDocumentFeagment)
  this.setGuard();
}

// 插入收尾撑开的元素
InfinityScroll.prototype.setGuard = function(){

  this._topGuard = document.createElement('div');
  this._topGuard.style.height = 0;

  this._tailGuard = document.createElement('div');
  this._tailGuard.style.height = this._itemHeight * (this.listData.length - this._limit) + 'px' ;

  this.el.insertBefore(this._topGuard,this._contentLi[0]);
  this.el.append(this._tailGuard);
}

InfinityScroll.prototype.initScrollLisener = function(){
  var scrollPosition = 0;
  var _this = this;
  this.el.addEventListener('scroll',function(e){
    
    var diffScroll = e.target.scrollTop - (scrollPosition + 1) * _this._itemHeight;

    if(Math.abs(diffScroll) > _this._itemHeight){
      //向上滚动
      if(diffScroll > 0){
        // 记录当前视口,建个新的
        var dataIndex = scrollPosition + _this._limit;
        // 到底不加载
        if(dataIndex >= _this.listData.length)return;
        var newItem = _this.createItemDom(_this.listData[dataIndex], dataIndex);

        // 头部守卫撑开一个高度
        // 移除头
        _this._topGuard.style.height = getEleHeight(_this._topGuard) + getEleHeight(_this._contentLi[0]) + 'px';
        _this.el.removeChild(_this._contentLi[0]);
        _this._contentLi.shift();
        // 保持当前滚动条位置不变
        // 插入尾
        _this.el.insertBefore(newItem,_this._tailGuard);
        _this._tailGuard.style.height = getEleHeight(_this._tailGuard) - getEleHeight(newItem) + 'px';
        _this._contentLi.push(newItem);
        scrollPosition++;
      } else{
        // 向下滚动
        var dataIndex = scrollPosition - 1;
        // 到顶不加载
        if(dataIndex === -1)return;
        var newItem = _this.createItemDom(_this.listData[dataIndex], dataIndex);

        // 删除尾
        _this._tailGuard.style.height = getEleHeight(_this._tailGuard)
                                          + getEleHeight(_this._contentLi[_this._contentLi.length - 1]) + 'px';
        _this.el.removeChild(_this._contentLi[_this._contentLi.length - 1]);
        _this._contentLi.pop();
        // 保持当前显示距离不变
        // 头部守卫撑开一个高度
        // 移除头
        _this.el.insertBefore(newItem,_this._contentLi[0]);
        _this._topGuard.style.height = getEleHeight(_this._topGuard) - getEleHeight(newItem) + 'px';
        _this._contentLi.unshift(newItem);
        
        scrollPosition--;
      }
    }
  },false)
}