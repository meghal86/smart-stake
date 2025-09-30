// Direct test of Chainalysis Public API
export async function testChainalysisAPI(address: string) {
  const API_KEY = '4dde6b530b6be799861647a0b1c173a0e4ed06be3deec12bb4de34fdd3d7a185';
  
  try {
    console.log('Testing Chainalysis Public API with address:', address);
    
    // Correct Chainalysis Public API format
    const response = await fetch(`https://public.chainalysis.com/api/v1/address/${address}`, {
      method: 'GET',
      headers: {
        'X-API-Key': API_KEY
      }
    });
    
    console.log('Chainalysis API Status:', response.status);
    
    if (response.ok) {
      const data = await response.json();
      console.log('Chainalysis API Success:', data);
      
      // Parse response according to documentation
      const isSanctioned = data.identifications && data.identifications.length > 0;
      const sanctionsList = data.identifications
        ?.filter((id: any) => id.category === 'sanctions')
        ?.map((id: any) => id.name || 'OFAC SDN List') || [];
      
      return { 
        success: true, 
        isSanctioned,
        sanctionsList,
        rawData: data 
      };
    } else {
      const errorText = await response.text();
      console.log('Chainalysis API Error:', errorText);
      return { success: false, error: `API Error: ${response.status} - ${errorText}` };
    }
    
  } catch (error) {
    console.error('Chainalysis API Error:', error);
    return { success: false, error: error.message };
  }
}