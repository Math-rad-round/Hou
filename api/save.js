export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // 验证请求体存在
    if (!req.body || typeof req.body !== 'object') {
      return res.status(400).json({ error: 'Invalid request body' });
    }

    // 提取并验证必填字段
    const { Name } = req.body;
    
    if (!Name || typeof Name !== 'string' || Name.trim() === '') {
      return res.status(400).json({ error: 'Name is required and must be a non-empty string' });
    }

    // 只允许特定的分数字段，提供默认值
    const allowedFields = ['Name', 'Score1', 'Score2', 'Score3'];
    const fields = {
      "Name": Name.trim()  // 必填字段
    };

    // 只添加存在的允许字段
// 假设你的表项数组是这样的
    const scoreFields = ['Score1', 'Score2', 'Score3','数字分数','数字争取率','问候分数','问候正确率']; // 也可以有更多项

    // 处理所有表项
    scoreFields.forEach(fieldName => {
      if (fieldName in req.body) {
        const scoreValue = Number(req.body[fieldName]);
        if (!isNaN(scoreValue)) {
          fields[fieldName] = scoreValue;
        }
      }
    });
    target = 'https://api.airtable.com/v0/appl4YcGhBdkhHOiQ/Table%201'
    if('target' in req.body){
      target=req.body.target;
    }
    // 构建 Airtable 数据
    const data = {
      performUpsert: {
        fieldsToMergeOn: ["Name"]
      },
      records: [{
        fields: fields
      }]
    };
    
    // 调用 Airtable API
    const airtableResponse = await fetch(
      target,
      {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${process.env.AIRTABLE_API_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
      }
    );

    if (!airtableResponse.ok) {
      const errorText = await airtableResponse.text();
      console.error('Airtable API error:', errorText);
      return res.status(airtableResponse.status).json({ 
        error: 'Failed to save to Airtable',
        details: errorText
      });
    }

    const result = await airtableResponse.json();
    return res.status(200).json({ 
      success: true, 
      message: 'Scores saved successfully',
      savedFields: Object.keys(fields),
      data: result
    });

  } catch (error) {
    console.error('Server error:', error);
    return res.status(500).json({ 
      error: 'Internal server error',
      message: error.message 
    });
  }
}