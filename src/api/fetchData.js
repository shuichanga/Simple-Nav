export const baseUrl = 'https://api.vika.cn/fusion/v1/datasheets';
const fieldKey = 'name';
const DEFAULT_ICON_URL = '/default.ico';

// 共享给其它 API 模块使用
export function getApiKey() {
  return import.meta.env.VITE_VIKA_API_KEY || localStorage.getItem('apiKey');
}

function getApiConfig(requireViewId = false) {
  const apiKey = getApiKey();
  const datasheetId = import.meta.env.VITE_VIKA_DATASHEET_ID || localStorage.getItem('datasheetId');
  const viewId = import.meta.env.VITE_VIKA_VIEW_ID || localStorage.getItem('viewId');

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
    const errorData = await response.json();
    throw new Error(errorData.message || 'API请求失败');
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
        icon: record.fields.icon || DEFAULT_ICON_URL,
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
