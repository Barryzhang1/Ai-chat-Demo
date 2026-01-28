## 点餐的具体流程图，以下是步骤

1. 需要用户提供点餐的需求
2. 如果输入跟点餐无关的，返回 “我是一个点餐系统不支持闲聊”
3. 如果跟点餐相关，需要用户提供点餐的需求，比如多少人预算多少，忌口，喜好
4. 用户发送需求以后，根据描述生成菜单，展示菜品名称，价格，描述
5. 如果用户点击确认，创建订单
6. 如果用户点击再看看，则询问用户还有什么需求，然后返回第一步重新开始，并记录刚才生成的菜单
7. 用户还可以点击刷新，会重新推荐一批
8. 创建订单成功以后给用户发送订单信息

```mermaid
graph TD
    Start((开始)) --> UserInput["用户提供点餐需求"]
    UserInput --> IsRelevant{"是否与点餐相关?"}
    
    IsRelevant -- "否" --> NoChitChat["返回：我是一个点餐系统不支持闲聊"]
    NoChitChat --> UserInput
    
    IsRelevant -- "是" --> GetDetails["收集详细需求<br/>(人数/预算/忌口/喜好)"]
    GetDetails --> SendDetails["用户提交详细需求"]
    
    SendDetails --> GenerateMenu["生成菜单<br/>(名称/价格/描述)"]
    
    GenerateMenu --> UserAction{"用户操作"}
    
    UserAction -- "点击确认" --> CreateOrder["创建订单"]
    CreateOrder --> OrderSuccess["发送订单信息"]
    OrderSuccess --> End((结束))
    
    UserAction -- "点击再看看" --> LookAgain["记录当前菜单并询问新需求"]
    LookAgain --> UserInput
    
    UserAction -- "点击刷新" --> GenerateMenu
```