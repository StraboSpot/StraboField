import {QAQC_PATHS} from "../../services/network/urls.constants";
import {getRequest} from "../../services/network/serverRequestHelpers";

const basicAuth = (token = encoded_login) => ({type: 'basic', token});

export const startQAQC = async (dataset, projectID, encodedLogin, toast) => {
    console.log("startQAQC()");
    if (!dataset.id) {
        console.error('Dataset ID is missing');
        alert('Error: Project ID is missing');
        return;
    }

    if (!encodedLogin) {
        console.error('User credentials are missing');
        alert('Error: User credentials are missing');
        return;
    }

    
    toast_id = toast.show(
    `Started QAQC process for ${dataset.name}, please wait until download...`,
    {
        type: 'normal',
        animationType: 'slide-in',
        duration: 20000,
        placement: 'top',
    });
        
    try{
        // Python script parameters
        const params = new URLSearchParams({
            'action': 'completeness',
            'plainreq': 'true',
            'doAnnotate': 'true',
            'pid': projectID,
            'dsid': dataset.id,
        });

        // Send the request
        const response = await getRequest(`${QAQC_PATHS.URL}/api.php?${params.toString()}`, basicAuth(encodedLogin), {responseType: 'document'});

        // Block until response
        await response.text();
        console.log("response.text() passed")

        if (!response.ok) {
            toast.hide(toast_id);
            throw new Error(`HTTP error. status: ${response.status}`);
        }

        // I think we want to force the user to download QAQC notes to avoid desync with local datasets
        // This just stalls for 3 seconds, the initializeDownload call is in DatasetDetails
        for (let iter = 3; iter > 0; iter--){
            toast.update(toast_id,
                `Downloading ${dataset.name} in ${iter} seconds.`,
                {type: 'warning'}
            );
            await new Promise(r => setTimeout(r, 1000));
        };

        toast.hide(toast_id);

        return response;

    } catch(err){
        console.error(`startQAQC(): ${err}`)
        throw(err)
    }

};

export const runQAQC = async (dataset, currentProjectId, setModalVisible, encodedLogin, toast) => {
    console.log("runQAQC()")
    setModalVisible(false);
    if (dataset && dataset.id) {
        try {
            return await startQAQC(dataset, currentProjectId, encodedLogin, toast);
        } catch (err) {
            console.error(`runQAQC(): ${err}`);
            alert(`runQAQC Error: ${err.message}`);
        }
    }
    else console.error('Target dataset or id is undefined!');
  };