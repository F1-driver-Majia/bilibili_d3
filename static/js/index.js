new Vue({
    el: '.index',
    data: {
        col: '播放',
        //目前正在展示的数据项
        data:[],
        //储存从csv读到的数据
        //月份
        months:[],
        //分区
        classes:[],
        //颜色
        color : {
                "动画":"#7b6888",//
                "游戏":"#4a486b",//
                "科技":"#6b486b",//
                "影视":"#a05d56",//
                "生活":"#d0743c",//
                "娱乐":"#ff8c00"//
        },
        redu: false,
        yuntu:false
    },

    created: function () {
        var that = this;

    },

    mounted: function () {
        var that = this;

        d3.csv('/static/data/bvdata.csv').then(function (csvdata) {
            csvdata.forEach(d => {
                d['播放'] = parseInt(d['播放']);
                d['点赞'] = parseInt(d['点赞']);
                d['硬币'] = parseInt(d['硬币']);
                d['分享'] = parseInt(d['分享']);
                d['弹幕'] = parseInt(d['弹幕']);

            });
            that.months = Array.from(new Set(csvdata.map(d => d['月份'])));
            //求出所有月份
            that.classes = Array.from(new Set(csvdata.map(d => d['分区'])));
            //求出所有的分区

            that.months.sort((a, b) => {
                return a - b
            });


            that.months.forEach(d => {
                that.data.push([]);
            });
            //每个月份创建数组放置八个分区

            csvdata.forEach(d => {
                that.data[that.months.indexOf(d['月份'])].push(d);
            });
            //把数据加入相应的数组
            console.log(that.months)
            console.log(that.classes)
            console.log(that.data)

            that.lineInit();
            //初始化柱状图
            that.pieInit();
            //柱状图初始化后再初始化饼状图
        })

    },

    methods:{
        lineInit: function() {
            var that = this;


            //从csv中读取数据，按月份进行分类


            const svg1 = d3.select('#linesvg');//选择操控的svg

            const width = svg1.attr('width');
            const height = svg1.attr('height');
            //得到宽和高
            const margin = {
                top: 10,
                right: 10,
                bottom: 20,
                left: 30
            };
            //内部图形的外边距
            const innerwidth = width - margin.left - margin.right;
            const innerheight = height - margin.bottom - margin.top;


            const x0Scale = d3.scaleBand()
                //序数比例尺
                .domain(that.months)
                .range([0, innerwidth])
                .padding(0.1);
            //定义了映射后的值域

            const x1Scale = d3.scaleBand()
                //小比例尺
                .domain(that.classes)
                .rangeRound([0, x0Scale.bandwidth()])
                .padding(0.05);

            const yScale = d3.scaleLinear()
                //序数比例尺
                .domain([0, 15000])
                //从下到上
                //调用list.map返回一个新的数组
                .range([0, innerheight].reverse())
                .nice();
            //设置间隔
            //定义了值域
            that.x0Scale = x0Scale;
            that.x1Scale = x1Scale;
            that.yScale = yScale;
            //将三个比例尺添加到data


            const g = svg1.append('g').attr('id', 'maingroup')
                .attr('transform', 'translate({0},{1})'.replace('{0}', margin.left).replace('{1}', margin.top));
            //创建图形并设置id 移动一段距离到内部

            const yAxis = d3.axisLeft(yScale)

            g.append('g')
                .call(yAxis)
                .attr("transform", 'translate({0},0)'.replace('{0}', margin.left))
                .select(".domain").remove()
                .append("text")
                .text("数量")
            //设置纵轴

            const xAxis = d3.axisBottom(x0Scale)
                .tickSizeOuter(0);
            g.append('g')
                .call(xAxis)
                .attr('transform', 'translate(0,{1})'.replace('{1}', innerheight))
                .select(".domain").remove()


            g.selectAll("group")
                .data(that.data)
                .enter()
                .append('g')
                .attr("class", "group")
                //对group增加一个父图
                .attr("transform", d => `translate(${x0Scale(d[0]['月份'])},0)`)
                .selectAll('.datarect')
                //子图
                .data(d => d.map(item => ({name: item['分区'], key: item['月份'], value: item[that.col]})))
                //每个月的数据生成一个新的数组
                .enter()
                .append('rect')
                .attr("class", "datarect")
                .attr("x", d => x1Scale(d.name))
                .attr("y", d => yScale(d.value))
                .attr("fill", d => that.color[d.name])
                .attr("width", x1Scale.bandwidth())

                //添加鼠标事件
                .on("mouseover", function () {
                    var rect = d3.select(this)
                        .transition()
                        .duration(1000)//当鼠标放在矩形上时，矩形变成
                        .attr("fill", "rgb(60, 60, 60)");

                    d3.selectAll('.text')
                        .transition()
                        .delay(500)
                        .attr("visibility", 'visible')
                })

                .on("mouseout", function () {
                    var rect = d3.select(this)
                        .transition()
                        .delay(500)//当鼠标移出时，矩形变成原色
                        .attr("fill", d => that.color[d.name]);

                    d3.selectAll('.text')
                        .transition()
                        .duration(1000)
                        .attr("visibility", 'hidden')
                })
                .transition()
                .duration(1000)
                .attr("height", d => (yScale(0) - yScale(d.value)));

            //添加标签
            d3.selectAll('.group')
                .selectAll('.text')
                .data(d => d.map(item => item['分区']))
                .enter()
                .append('text')
                .attr('class', 'text')
                .attr("x", (d => x1Scale(d) + x1Scale.bandwidth() / 3))
                .attr("y", '1em')
                .attr("font-size", "14px")
                .text(d => d)
                .attr("visibility", 'hidden')



        },

        lineUpdate: function (e) {
            var that = this;

            that.yuntu = false
            that.redu = false
            //将图片层隐藏

            s = ['播放','点赞','硬币','分享','弹幕'];
            fields = document.getElementsByClassName('head-menu-field');

            that.col = e.target.dataset.col;

            i1 = s.indexOf(that.col);

            for(var i=0;i<fields.length;i++){
                fields[i].style.backgroundColor = "transparent";
            }

            fields[i1].style.backgroundColor = "rgb(109, 153, 209)";
            //以上都是改变按钮颜色



            //更新绑定数据
            d3.selectAll('.group')
                .selectAll('.datarect')
                        //子图
                        .data(d=>d.map(item=>({name:item['分区'],key:item['月份'],value : item[that.col]})),item=>item.name)
                        //每个月的数据生成一个新的数组
                        //添加主键
                            .transition()
                            .duration(1000)
                            .attr("x", d => that.x1Scale(d.name))
                            .attr("y", d => that.yScale(d.value))
                            .attr("fill", d => that.color[d.name])
                            .attr("width", that.x1Scale.bandwidth())
                            .attr("height", d =>(that.yScale(0)-that.yScale(d.value)));
            that.pieUpdate();
        },

        pieInit:function () {
            var that = this;
            that.pieUpdate();
        },


        pieUpdate:function () {
            var that = this;
            if(that.process){
                clearInterval(that.process)
            }

            data = that.data;
            pie = d3.pie()
                .sort(null)
                .value(d=>d[that.col])
            //设置pie转化数据


            height = 400;
            width = 400;


            arc = d3.arc()
                .innerRadius(0)
                .outerRadius(d3.min([width,height])/2-1);
            //弧的生成函数

            arcLabel = d3.arc()
                .innerRadius(radius = d3.min([width,height])/2*0.8)
                .outerRadius(radius = d3.min([width,height])/2*0.8)

            arcs0 = pie(data[0])
            //求和用于求百分比

            const svg = d3.select('#pieChart')
                    .attr("viewBox",[-width/2,-height/2,width,height]);



            function update() {
                if(i==that.months.length)
                    clearInterval(cir);
                //停止前一个视图的刷新

                arcs = pie(that.data[i]);

                sum0 = 0
                for (item of arcs0) {
                    sum0 += item.value;
                }

                svg.selectAll('.pies')
                    .transition()
			        .delay(0)
			        .duration(500)
                    .attr('fill','white')



                svg.select('.piegroup')
                    .transition()
			        .delay(500)
			        .duration(0)
                    .remove()

                svg.select('.span')
                    .remove()

                d3.selectAll('.time')
                    .remove()

                console.log(arcs[0].data['月份'])

                //去除掉原来的圆
                svg.append('g')
                    .attr('class','time')
                    .append('text')
                    .attr('transform','translate(-330,0)')
                    .attr('font-size','2em')
                    .text(arcs[0].data['月份']);

                svg.append('g')
                    .attr('class','piegroup')
                    .attr("stroke",'white')
                .selectAll('path')
                .data(arcs)
                .join('path')
                    .transition()
			        .delay(0)
			        .duration(500)
                    .attr("transform","translate(0,0)")
                    .attr('fill',d=>that.color[d.data['分区']])
                    .attr('d',arc)
                    .attr("class","pies")

                svg.append("g")
                    .attr('class','span')
                  .attr("font-family", "sans-serif")
                  .attr("font-size", 12)
                  .attr("text-anchor", "middle")
                .selectAll("text")
                .data(arcs)
                .join("text")
                  .attr("transform", d => `translate(${arcLabel.centroid(d)})`)
                  .call(text => text.append("tspan")
                      .attr('class','tspan')
                      .attr("y", "-0.4em")
                      .attr("font-weight", "bold")
                      .text(d => d.data['分区']))
                  .call(text => text.filter(d => (d.endAngle - d.startAngle) > 0.25).append("tspan")
                      .attr('class','tspan')
                      .attr("x", 0)
                      .attr("y", "0.7em")
                      .attr("fill-opacity", 0.7)
                      .text(d => (d.value/sum0).toFixed(2)*100 + "%"));

                    i++;
            }

            var i=0;
            var cir = setInterval(update,2000)
            that.process = cir;

        },

        showyuntu:function (e) {
            this.yuntu = true;
            this.redu = false;
            fields = document.getElementsByClassName('head-menu-field');
            for(var i=0;i<fields.length;i++){
                fields[i].style.backgroundColor = "transparent";
            }
            fields[5].style.backgroundColor = "rgb(109, 153, 209)";
        },
        showredu:function (e) {
            this.redu = true;
            this.yuntu = false;
            fields = document.getElementsByClassName('head-menu-field');
            for(var i=0;i<fields.length;i++){
                fields[i].style.backgroundColor = "transparent";
            }
            fields[6].style.backgroundColor = "rgb(109, 153, 209)";
        }
    }
})





//设置横轴

// g.selectAll('.dataRect').data(data).enter().append('rect')
//     .attr('width', d => xScale(d.value))
//     .attr('height', yScale.bandwidth())
//     .attr('y', d => yScale(d.name))
//     .attr('fill', 'green')
//     .attr('opacity', '0.8')
//
//
//         //使用绑定数据，绑定一个空集
//         //绑定数据后调用方法enter()选取未绑定部分
//         //d3.selectAll('rect').data(data1,d => d.name).attr('width',d => xScale(d.value))
//         //重新绑定时要设置索引
//
//         d3.selectAll('.tick text').attr('font-size', '10px')
//             //设置纵坐标文字大小
//
//         g.append('text').text('bilili')
//             .attr('font-size', '40px')