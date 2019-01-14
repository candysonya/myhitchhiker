#### Schedule 结果

Schedule会按照period的设置自动来跑，并且在跑完后发送邮件给相关人员。

跑完后可以在Schedule模块里直观的看到结果：

一行代表跑的一次，结果里有这几个列：

* Pass:  这次的任务是否完全通过，包括正确返回及Test case的结果
* Duration: 任务的总耗时
* Description: 任务结果的概述，包括多少成功，多少失败等

每一个任务的结果下面有一个子表，展示了这个Collection下面所有请求的运行结果，有以下列：

* Param: 请求的参数，在Parameters里设置的参数会自动生成请求，这些请求会有Param
* Pass: 请求是否成功
* Duration: 这个请求所消耗的时间
* Environment: 使用的环境
* Headers, Body: 请求返回的头和主体
* Test: 请求的Test case跑的结果
  
如果选择了对比环境，则每个请求会有两行数据。

![](https://raw.githubusercontent.com/brookshi/images/master/Hitchhiker/schedule/schedule_run.png)

#### Schedule 统计视图

Schedule默认展示的视图是每次跟Collection的结果，这个表里对于每个Request的运行状态就很难表现出来，有时我们需要看哪些request比较稳定，哪些会经常有问题。这时就可以看统计视图。

exculde depredated request选项, 默认是true，如果false的话会把曾经在这个Collection现在已经被删掉的记录也包含进来。

![](https://raw.githubusercontent.com/brookshi/images/master/Hitchhiker/schedule/statistics.png)

#### 一次跑多个Schedule

每个Schedule前面都有个checkbox，勾上的话会有一个Run Selected Schedules的按钮在上面显示出来，点这个按钮会一次跑所有勾上的Schedule。

![](https://raw.githubusercontent.com/brookshi/images/master/Hitchhiker/schedule/runselect.png)

#### Schedule 对比结果Diff

如果Schedule勾选了环境对比，并且跑的时候两个环境的对比不一致的话可以看到Match那一列会多出一个按钮：`view diff`，点击可以以Diff方式查看两者的不同。

![](https://raw.githubusercontent.com/brookshi/images/master/Hitchhiker/schedule/schedule_diff.png)

#### Schedule 菜单

有时我们需要手动来跑Schedule，这时可以在Schedule的菜单里选择Run Now。

把鼠标移到Schedule Item上，会有一个...按钮，鼠标移上去会弹出一个菜单如下：

![](https://raw.githubusercontent.com/brookshi/images/master/Hitchhiker/schedule/schedule_menu.png)

* Run Now: 用来手动跑Schedule的，跑的结果会实时显示出来 (基于WebSocket).
* Edit: 修改Schedule的参数
* Suspend/Resume: 暂时或恢复这个Schedule
* Delete: 删除Schedule.

#### Run Now 接口

Hitchhiker有一个对外部公开的`Run now`接口，url: `http://ip:port/api/schedule/{schedule_id}/run`，通过这个接口可以实现在外部程序中跑Schedule，比如Jenkins，记得在url或header里把http authorization传上。

`schedule_id` 可以通过在Hitchhiker里点一下Run Now来获取，会显示在浏览器的控制台里。