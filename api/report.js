export default function handler(req, res) {
    // 只接受 POST 请求（手机上报）
    if (req.method === 'POST') {
        const { device_id, battery, signal } = req.body;
        if (!device_id) {
            return res.status(400).json({ error: 'Missing device_id' });
        }
        
        // 这里我们直接把收到的数据返回，哪吒监控会通过另一个接口拉取
        // 但因为我们只有一个接口，我们可以把数据暂存到内存中
        // 注意：Vercel 无服务器函数可能会冷启动，内存不持久，但对我们这种实时监控足够
        // 更好的方法是用 Vercel KV 或简单数据库，但为了极简，我们直接用内存
        
        // 我们用一个全局对象存储（注意：在 serverless 环境中，全局对象可能在多次调用间不共享，但同一个实例短时间内会共享）
        if (!global.deviceData) global.deviceData = {};
        global.deviceData[device_id] = {
            battery,
            signal,
            timestamp: Date.now()
        };
        
        return res.status(200).json({ status: 'ok' });
    }
    
    // 处理 GET 请求（哪吒监控拉取）
    if (req.method === 'GET') {
        const { device } = req.query;
        if (!device) {
            return res.status(400).json({ error: 'Missing device parameter' });
        }
        const data = global.deviceData?.[device];
        if (!data) {
            return res.status(404).json({ error: 'Device not found' });
        }
        return res.status(200).json(data);
    }
    
    // 其他方法不支持
    res.setHeader('Allow', ['GET', 'POST']);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
}
