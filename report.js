let reportData;

function initReportControls() {
    const form = document.getElementById('reportForm');
    const reportCustomReason = document.getElementById('reportCustomReason');
    /** @type {HTMLSelectElement} */
    const reportReasonSelect = document.getElementById('reportReasonSelect');

    reportReasonSelect.addEventListener('input', function () {
        const cannedValue = !!this.value;
        reportCustomReason.classList.toggle('hidden', cannedValue);
        form.customReason.toggleAttribute('required', !cannedValue);
    });

    form.addEventListener('submit', async function () { 
        const reason = this.reason.value || this.customReason.value;

        await apiJsonPost('report', {
            uuid: reportData?.uuid,
            original_msg: reportData?.msg,
            reason,
            msg_id: reportData?.msgId,
        }).then(
            resp => { if (!resp.ok) throw new Error(resp.statusText); },
            err => console.error(err),
        );

        this.reset();
        closeModal();
    });
}

/**
 * @param {*} [props]
 */
function openReportForm(props) {
    reportData = props;
    const form = document.getElementById('reportForm');
    form.reset();
    form.reason.dispatchEvent(new Event('input'));
    openModal('reportModal');
}
