export const baseUrl = 'https://api.vika.cn/fusion/v1/datasheets';
const fieldKey = 'name';

// 共享给其它 API 模块使用。优先级：本地存储 > 环境变量
export function getApiKey() {
  return localStorage.getItem('apiKey') || import.meta.env.VITE_VIKA_API_KEY;
}

function getApiConfig(requireViewId = false) {
  const apiKey = getApiKey();
  const datasheetId = localStorage.getItem('datasheetId') || import.meta.env.VITE_VIKA_DATASHEET_ID;
  const viewId = localStorage.getItem('viewId') || import.meta.env.VITE_VIKA_VIEW_ID;

  if (!apiKey || !datasheetId || (requireViewId && !viewId)) {
    throw new Error('API配置不完整，请前往设置页面配置');
  }

  return { apiKey, datasheetId, viewId };
}

export async function apiRequest(url, options = {}) {
  const response = await fetch(url, {
    ...options,
    headers: {
      Authorization: `Bearer ${options.apiKey}`,
      ...(options.headers || {})
    }
  });

  if (!response.ok) {
    let message = 'API请求失败';
    try {
      const errorData = await response.json();
      message = errorData.message || message;
    } catch (e) {
      // 错误响应不是 JSON 时保留默认信息
    }
    const error = new Error(message);
    error.status = response.status;
    throw error;
  }

  return response.json();
}

export async function fetchData() {
  try {
    const { apiKey, datasheetId, viewId } = getApiConfig(true);
    const apiUrl = `${baseUrl}/${datasheetId}/records?viewId=${viewId}&fieldKey=${fieldKey}&pageSize=1000`;

    const responseData = await apiRequest(apiUrl, { apiKey });

    if (!responseData?.data?.records || !Array.isArray(responseData.data.records)) {
      throw new Error(`返回数据格式不正确`);
    }

    return responseData.data.records.map(record => {
      if (!record.fields?.name) {
        return null;
      }
      return {
        id: record.recordId,
        category: record.fields.category || '',
        name: record.fields.name,
        url: record.fields.url,
        description: record.fields.description || '',
        // 留空表示「未配置图标」，由 Card 组件走自动获取与兜底链
        icon: record.fields.icon || '',
        sortOrder: record.fields.order ? parseInt(record.fields.order) : 0,
        updatedAt: record.updatedAt || record.fields.updatedAt || null
      };
    }).filter(Boolean).sort((a, b) => b.sortOrder - a.sortOrder);
  } catch (error) {
    throw error;
  }
}

// 批量更新网站记录，patches: [{ recordId, fields }]
export async function batchUpdateWebsiteRecords(patches) {
  const { apiKey, datasheetId } = getApiConfig();
  for (let i = 0; i < patches.length; i += 100) {
    const chunk = patches.slice(i, i + 100);
    const requestBody = { records: chunk, fieldKey: 'name' };
    await apiRequest(`${baseUrl}/${datasheetId}/records?fieldKey=name`, {
      method: 'PATCH',
      apiKey,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(requestBody)
    });
  }
}

export async function addWebsite(websiteData) {
  try {
    const { apiKey, datasheetId } = getApiConfig();
    const apiUrl = `${baseUrl}/${datasheetId}/records?fieldKey=name`;

    const fields = {
      name: websiteData.name,
      url: websiteData.url,
      description: websiteData.description,
      order: String(websiteData.order ?? 0)
    };
    if (websiteData.category) {
      fields.category = websiteData.category;
    }
    if (websiteData.icon !== undefined && websiteData.icon !== null) {
      fields.icon = websiteData.icon;
    }

    const requestBody = {
      records: [{ fields }],
      fieldKey: "name"
    };

    const responseData = await apiRequest(apiUrl, {
      method: 'POST',
      apiKey,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(requestBody)
    });

    if (!responseData?.data?.records || !Array.isArray(responseData.data.records)) {
      throw new Error(`返回数据格式不正确`);
    }

    return responseData.data.records[0];
  } catch (error) {
    throw error;
  }
}

export async function deleteWebsite(recordId) {
  try {
    const { apiKey, datasheetId } = getApiConfig();
    const apiUrl = `${baseUrl}/${datasheetId}/records?recordIds=${recordId}`;

    return await apiRequest(apiUrl, {
      method: 'DELETE',
      apiKey,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    throw error;
  }
}

export async function updateWebsite(recordId, websiteData) {
  try {
    const { apiKey, datasheetId } = getApiConfig();
    const apiUrl = `${baseUrl}/${datasheetId}/records?fieldKey=name`;

    const fields = {
      name: websiteData.name,
      url: websiteData.url,
      description: websiteData.description || '',
      order: String(websiteData.order ?? 0)
    };
    if (websiteData.category) {
      fields.category = websiteData.category;
    }
    if (websiteData.icon !== undefined) {
      fields.icon = websiteData.icon;
    }

    const requestBody = {
      records: [
        {
          recordId: recordId,
          fields: fields
        }
      ],
      fieldKey: "name"
    };

    const responseData = await apiRequest(apiUrl, {
      method: 'PATCH',
      apiKey,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(requestBody)
    });

    if (!responseData?.data?.records || !Array.isArray(responseData.data.records)) {
      throw new Error(`返回数据格式不正确`);
    }

    return responseData.data.records[0];
  } catch (error) {
    throw error;
  }
}
