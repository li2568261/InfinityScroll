// 创建一个documentFragment
var oDocumentFeagment = document.createDocumentFragment();

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
  this._beginIndex = 0; // 起始index
  this._endIndex = 0; // 终止index
  this._contentLi // 所有渲染子元素数组
  this._countHeight = 0 // 所有渲染子元素的总高度
  this._topGuard // 头部撑开高度元素

  this.init(option);
}

const init = function(option){
  this.el = query(option.el);
  
  if(option.itemModel && typeof option.itemModel === 'function'){
    this.itemModel = option.itemModel;
  } else {
    console.error('itemModel is required, typeof function');
    this.itemModel = new Function();;
  }

  this.listData = option.listData || [];
  
  
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

// 渲染当前itemd
InfinityScroll.prototype.createItemDom = function(data, index){ 
  return parseDom(this.itemModel(data, index))[0];
}

InfinityScroll.prototype.firstRender = function(){
  // 清空html
  this.el.innerHTML = ''; 
  
  this._contentLi = [];

  var _this = this;
  
  // 渲染两屏防止渲染不及时出现空白区
  while(this._endIndex < this.listData.length && this._countHeight < this._warpHeight * 3){
    // 依次渲染
    var itemEl =  _this.createItemDom(this.listData[this._endIndex], this._endIndex);
    this._countHeight += getEleHeight(itemEl);
    oDocumentFeagment.append(itemEl);
    this._contentLi.push(itemEl);
    this._endIndex++;
  }

  this.el.append(oDocumentFeagment)
  this.setGuard();
}

// 插入头部撑开的元素
InfinityScroll.prototype.setGuard = function(){

  this._topGuard = document.createElement('div');
  this._topGuard.style.height = 0;

  this.el.insertBefore(this._topGuard,this._contentLi[0]);
}

InfinityScroll.prototype.renderSpillItem = function(tail,height){
  var splillHeight = 0;
  var _this = this;
  var renderTail = function(){
    while(splillHeight < height && _this._endIndex < _this.listData.length){
      var itemEl =  _this.createItemDom(_this.listData[_this._endIndex], _this._endIndex);
      splillHeight += getEleHeight(itemEl);
      oDocumentFeagment.append(itemEl);
      _this._contentLi.push(itemEl);
      _this._endIndex++;
      _this.el.append(oDocumentFeagment);
    }
  }
  var renderTop = function(){
    while(splillHeight < height && _this._beginIndex > 0){
      var itemEl =  _this.createItemDom(_this.listData[_this._beginIndex - 1], _this._beginIndex - 1);
      splillHeight += getEleHeight(itemEl);
      oDocumentFeagment.append(itemEl);
      _this.el.insertBefore(oDocumentFeagment, _this._contentLi[0]);
      _this._contentLi.unshift(itemEl);
      _this._endIndex--;
    }
  }
  tail ? renderTail() : renderTop();
  this._countHeight+=splillHeight;

}
InfinityScroll.prototype.initScrollLisener = function(){
  // 触发向下滚动
  var triggerTopScrollHeight = this._warpHeight;
  // TODO:预留后期制定index渲染
  var topGruarHeight = getEleHeight(this._topGuard);

  var _this = this;
  this.el.addEventListener('scroll',function(e){
    //向上滚动
    if(e.target.scrollTop > triggerTopScrollHeight){
      // 记录当前视口,建个新的
      // 到底不加载
      if(_this._endIndex === _this.listData.length)return;
      var delEleHeight = getEleHeight(_this._contentLi[0]);
      _this.renderSpillItem(true, delEleHeight);
      // 头部守卫撑开一个高度
      // 移除头
      topGruarHeight += delEleHeight;
      _this._topGuard.style.height = topGruarHeight + 'px';
      _this.el.removeChild(_this._contentLi.shift());
      triggerTopScrollHeight = topGruarHeight + getEleHeight(_this._contentLi[1]);
      _this._beginIndex++;
    } else{
      // 滚动太快防止时间没有捕获到
      while(e.target.scrollTop <= topGruarHeight && _this._beginIndex > 0){
        // 向下滚动
        // 到顶不加载
        var delEleHeight = getEleHeight(_this._contentLi[_this._contentLi.length - 1]);
        _this.renderSpillItem(false, delEleHeight);
        topGruarHeight -= getEleHeight(_this._contentLi[0]);

        // 保持当前显示距离不变
        // 头部守卫撑开一个高度
        // 移除头
        triggerTopScrollHeight = topGruarHeight + getEleHeight(_this._contentLi[1]);
        _this._topGuard.style.height = topGruarHeight + 'px';
        _this.el.removeChild(_this._contentLi.pop());
        
        _this._beginIndex--;
      }
      
      
    }
  })
}