#### 0.14 2018-07-29

**Features:**

* \#95 支持接口文档功能
* \#230 改成编辑器性能
* \#231 Schedule里的setting选项增加：1. 完成后或当失败后发送邮件， 2. 仅发送失败case或发送所有case。去掉环境变量里的 `HITCHHIKER_SCHEDULE_MAILFORFAIL`。
注意：这是一个破坏性改动，如果以前有设置过环境变量：`HITCHHIKER_SCHEDULE_MAILFORFAIL`，需要给具体的schedule重新设置。以前是所有统一设置，现在是每个schedule可以自己设置自己的。
* \#232 给Parameters里的OneByOne增加识别数组的功能，以前只支持对象，现在支持把[{a: 1, b:2}, {a:3, b:4}]识别成两个case。
* \#234 支持导出schedule结果到cls。

**Bugs:**

* \#214 开启密码加密后，刷新浏览器后丢掉session
* \#216 项目邀请邮件发送失败
* \#219 URL传参值错误
* \#226 URL encode时对参数中+号的encode结果不正确，预期是%2B，实际将+号作为URI中的空格编码为%20


#### 0.13 2018-06-15

**Features:**

* \#93 folder 级和 collection 级的通用设置 request 基本信息，支持header, pre request script, test
* \#112 增加Stress Test结果的细节展示功能，支持表格/图表
* \#107 自动备份数据库，防止数据丢失
* \#194 把docker内的日志volumn到host
* \#118 加一个环境变量 HITCHHIKER_ENCRYPT_PASSWORD 来控制是否对数据库里的用户密码加密， 默认是关闭，对于老用户来说开了这个功能，会影响已经系统里现有的账号，导致不能登录。
有两个方案：
第一种： 如果账号用的邮箱是有效邮箱的话，可以用找回密码功能重置密码。
第二种： 可以用一个简单的密码，比如123456，注册一个新用户，这个密码在数据库里会是一个md5格式的字符串，在数据库里update所有用户的密码，改成这个md5，这样所有用户就都可以用123456这个密码来登录然后修改密码。需要注意的是，直接操作数据库前先备份一下。

**Bugs:**

* \#197 刷新时正在同步更新session会导致cookie失效
* \#117 轻微bug: header中收藏的key 取消收藏以后,还会提示


#### 0.12.1 2018-06-01

**Features:**

* \#149 改进对swagger的导入支持

**Bugs:**

* \#172 如果语言改错，默认使用en
* \#192 使用request库时会提示cannot find module 'hawk'
* \#189 在脚本里使用console.log时，如果输出的是对象会导致异常


#### 0.12 2018-05-23

**Features:**

* \#119 增加几个批量关闭标签的功能（全部关闭，关闭保存，关闭当前标签外的所有）
* \#147 response增加一个Console(日志)用于显示请求执行过程及脚本里调用的console，这样方便调试脚本和变量
* \#123 对Parameters里的many to many增加算法选项：pairwise，用于减少用例
* \#174 压缩请求返回的数据
* \#128 对于docker，给global_data下面的project做持久化（破坏性改动，之前上传的在新版本需要再上传一次）
* \#133 在Test里获取hitchhiker.request
* \#121 给新用户增加更多例子

**Bugs:**

* \#152 修复上传的project libs对于自动化测试无效


#### 0.11 2018-04-28

**Features:**

* \#158 脚本增加hitchhiker简称hkr，(hkr.setEnvVariable)
* \#110 支持Common Pre Request Script里用getEnvVariable拿环境变量
* \#124 以Key-value形式展示和编辑以及描述url的 Query 字符串
* \#12  body里支持key-value形式展示和编辑以及描述form数据
* \#122 parameters里面增加一个Beautify功能
* \#127 Schedules 页面样式优化
* 增加request描述编辑

**Bugs:**

* \#132 使用[new Request from cUrl]创建请求时，解析空字符串有点问题，会报错
* \#146 当chrome的开发者工具，高度盖过“加载中”的动画时，chrome浏览器页面会卡死，无响应
* \#138 parameters lenght显示错误
* \#105 测试报告中过滤器会导致对比报告样式错乱


#### 0.10 2018-03-13

**Features:**

* \#104 支持中文版.
* \#106 如果需要，Url前自动加http://
* \#116 导入postman时form转成body

**Bugs:**

* \#91 修复form data有特殊符号时的异常
* \#103 改进email格式校验

#### 0.9 2018-01-29

**Feature:**

* 基于UI的断言

#### 0.8 2018-01-14

**Features:**

* Schedule的统计视图.
* \#67 中断压力测试.
* \#64 一次跑多个Schedule.
* Schedule 表过滤.
* 已编译好的安装包及一步一步安装.

**Bugs:**

* Duplicate出来的environment的改动变影响到原始的environment.


#### 0.7 2017-12-31

**Features:**

* \#63 支持在脚本里写console.log(info, warn, error)来调试代码
* \#57 Parameters可以做为一个变量存在，以便在运行时动态生成Parameters
* \#34 支持自定义SMTP来发送邮件
* \#30 支持导入Swagger
* 支持以cURL来新建request
* 支持为request生成java, python, go, c#等语言的请求代码
* 支持美化body
* 支持xml response的美化
* 可以以diff方式查看Schedule的对比结果
* 去消body或脚本里使用变量时编辑框的语法错误提示

**Bugs:**

* 新Collection的Common pre script保存不了
* Schedule在勾上保存然后取消勾时会保存不了
* 导入Postman json时出错，有header为null
* 请求如果没响应时，请求返回的时间会为0

#### 0.6 2017-12-18

**Features:**

* \#45 重写压力测试，支持现有所有新特性，比如ES6, 自定义的js包
* 重新整理请求流程，参考流程图：[workflow](https://raw.githubusercontent.com/brookshi/images/master/Hitchhiker/script/reuqest_wf.png) 
* 环境变量在所有脚本内都可用
* \#47 如果response是图片的话就直接显示图片，而不是图片内容

**Bugs:**

* \#62 global function 里的内容在切换模块后会消失
* \#59 schedule里的请求返回是图片时，会造成JSON.parse失败，导致异常，改了图片只保存链接，不保存内容
* \#55 浏览器里压力测试的websocket有时会失败，加了重试
* schedule的定时跑的记录会有1分钟左右的误差
* 改请求的method时name会被重置


#### 0.5 2017-11-28

**Features:**

* \#41 Script 增加属性request来得到请求的信息，增加方法setRequest(request)来对请求进行修改。
* \#41 在Collection下增加Common Pre Request Script，这里可以对Collection下的所有request起作用。
* \#42 增加配置 inviteMemberDirectly 来设置邀请Project成员时是否需要通过邮件，true即直接加到Project里，默认为true。
* \#43 使用gitbook重新组织了文档： https://brookshi.gitbooks.io/hitchhiker/content/cn/introduction.html
* \#44 在Collection下增加option: Request Follow Redirect，决定这个Collection下的请求是否需要在状态码为3xx时继续跳转，默认为false。
* \#51 在Collection下增加option: Request Strict SSL，决定这个Collection下的请求是否验证SSL证书是否合法，默认为false。


#### 0.4.2 2017-11-18

**Bugs:**

* \#50 压力测试异常，错误使用setInterval


#### 0.4.1 2017-11-15

**Bugs:**

* \#40 post数据大于1M时出现异常: Payload Too Large


#### 0.4 2017-11-13

![](https://raw.githubusercontent.com/brookshi/images/master/Hitchhiker/pre_request_script.PNG)

**Features:**

* 增加 pre request script。
* \#29 项目文件夹系统，支持上传js或数据文件到文件夹并可以在脚本里使用它们。
* \#22 schedule支持以小时或分钟为单位。
* \#34 支持自定义邮件发送接口。
* \#24 开放schedule的run now接口以便其他程序调用。

**Bugs:**

* \#24 schedule的顺序执行无效
* sync有时会覆盖用户已经更改的数据
* sync时环境变量编辑对应框里的内容会被清掉


#### 0.3 2017-10-30

![](https://raw.githubusercontent.com/brookshi/images/master/Hitchhiker/sync.gif)

**Features:**
* 支持数据自动同步更新

**Bugs:**
* 修正url不支持中文


#### 0.2 2017-10-15

![](https://raw.githubusercontent.com/brookshi/images/master/Hitchhiker/stresstest.gif)

**Features:**

* 支持压力测试

* 支持在源码部署时改端口

**Bugs:**

* 修正Schedule跑空Collection时的异常


#### 0.1.3 2017-09-24

![](https://raw.githubusercontent.com/brookshi/images/master/Hitchhiker/parameters.gif)

**Features:**
* 参数化请求，可以使用随机组合的`ManytoMany`或者一对一组合的`OnetoOne`。 请求通常有很多参数，比如query string, body等，这些参数可能会有不止一个值，每个都要覆盖的话需要写很多request，比如一个request有三个可变的参数，每个参数又有3个值，随机组合下来会有`3*3*3=27个request`，这很麻烦，其实它们之前只是一点不同，现在可以使用参数来帮你做这个事，只需要把可变的参数写在parameter里面，系统会自动构建出request。

* 做schedule对比数据前可以先处理返回的response，再用处理后的数据进行比对，在test里使用 $export$(data) 来导出需要比对的数据。

* \#13 请求的默认headers，这些header可以在根目录下的appconfig.json里配置，默认定义的是这些：
``` json
"defaultHeaders": [
    "Accept:*/*",
    "User-Agent:Mozilla/5.0 (Windows NT 6.1; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/60.0.3112.113 Safari/537.36",
    "Cache-Control:no-cache"
]
```

**Bugs:**

* 没有处理test返回undefined的情况，改为返回失败

* 如果request不包含cookie且本地也没有cookie时发了空的cookie header，改为不发cookie header

* Save As request时原request会受到影响


#### 0.1.2 2017-09-09

**Features:**

* 添加清除本地Cache功能

* request的header提示及自动完成

* 可以收藏常用的request header，方便下次使用

* 可以在Project里定义tests的全局函数，方便其下的Request直接使用

* 略微调整UI


#### 0.1.1 2017-08-26

**Features:**

* Request历史记录

* 成员可以添加Localhost映射

* 在Collection/Folder的菜单里创建Request

* Schedule可以选择是否要对某个Request做match

* Schedule的结果在Request前面加上Folder

* 免登录试用

**Bugs:**

* 复制Request后源Request的headers有时会丢失

* Schedule编辑对话框应该只能选择当前Collection的环境

* 跑空Schedule会出错

* 选择了Project的话Folder不能展开


#### 0.1.0 2017-07-24