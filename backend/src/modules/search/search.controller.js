import StudentModel from '../student/student.model.js';
import WorkflowModel from '../workflow/workflow.model.js';
import PaymentModel from '../payment/payment.model.js';
import RtoModel from '../rto/rto.model.js';
import IndustryModel from '../industry/industry.model.js';

function escapeRegex(string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export const globalSearchController = async (req, res, next) => {
  try {
    const rawQuery = String(req.query.q || '').trim();
    if (!rawQuery) {
      return res.status(200).json({
        success: true,
        data: {
          students: [],
          requests: [],
          appointments: [],
          placements: [],
          payments: [],
          rtos: [],
          industries: [],
        },
      });
    }

    const clean = escapeRegex(rawQuery);
    const regex = new RegExp(clean, 'i');

    const [students, workflows, payments, rtos, industries] = await Promise.all([
      StudentModel.find({
        $or: [
          { name: regex },
          { firstName: regex },
          { lastName: regex },
          { studentId: regex },
          { emailAddress: regex },
          { email: regex },
          { courseQualification: regex },
          { courses: regex },
          { assignedRto: regex },
          { institute: regex },
          { placementStatus: regex },
        ],
      })
        .select('_id studentId name firstName lastName emailAddress email assignedRto courseQualification courses placementStatus status')
        .limit(6)
        .lean(),

      WorkflowModel.find().lean(),

      PaymentModel.find({
        $or: [
          { studentName: regex },
          { studentId: regex },
          { rto: regex },
          { course: regex },
          { invoiceNumber: regex },
          { placementStatus: regex },
          { paymentStatus: regex },
        ],
      })
        .select('_id student studentId studentName rto course paymentAmount totalAmount placementStatus paymentStatus invoiceNumber')
        .limit(6)
        .lean(),

      RtoModel.find({
        $or: [
          { name: regex },
          { code: regex },
          { contactName: regex },
          { email: regex },
        ],
      })
        .select('_id name code contactName email phone address')
        .limit(6)
        .lean(),

      IndustryModel.find({
        $or: [
          { companyName: regex },
          { organizationName: regex },
          { industryType: regex },
          { contactPerson: regex },
          { email: regex },
        ],
      })
        .select('_id companyName organizationName industryType contactPerson email phone address')
        .limit(6)
        .lean(),
    ]);

    // Extract workflow subdocuments matching query
    const allRequests = [];
    const allAppointments = [];
    const allInternships = [];

    workflows.forEach((wf) => {
      (wf.requests || []).forEach((r) => {
        const text = `${r.reqId || ''} ${r.title || ''} ${r.student || ''} ${r.studentId || ''} ${r.company || ''} ${r.rto || ''} ${r.status || ''}`;
        if (regex.test(text)) {
          allRequests.push({
            id: r._id || r.id,
            reqId: r.reqId,
            title: r.title,
            student: r.student,
            studentId: r.studentId,
            company: r.company,
            rto: r.rto,
            status: r.status,
          });
        }
      });

      (wf.appointments || []).forEach((a) => {
        const text = `${a.apptId || ''} ${a.student || ''} ${a.studentId || ''} ${a.company || ''} ${a.position || ''} ${a.status || ''}`;
        if (regex.test(text)) {
          allAppointments.push({
            id: a._id || a.id,
            apptId: a.apptId,
            student: a.student,
            studentId: a.studentId,
            company: a.company,
            position: a.position,
            status: a.status,
            date: a.date,
          });
        }
      });

      (wf.internships || []).forEach((i) => {
        const text = `${i.intId || ''} ${i.student || ''} ${i.studentId || ''} ${i.company || ''} ${i.title || ''} ${i.status || ''}`;
        if (regex.test(text)) {
          allInternships.push({
            id: i._id || i.id,
            intId: i.intId,
            student: i.student,
            studentId: i.studentId,
            company: i.company,
            title: i.title,
            status: i.status,
            start: i.start,
            end: i.end,
          });
        }
      });
    });

    const mappedStudents = students.map((s) => ({
      id: s._id,
      studentId: s.studentId,
      name: s.name || [s.firstName, s.lastName].filter(Boolean).join(' ') || 'Student',
      email: s.emailAddress || s.email || '',
      rto: s.assignedRto || s.institute || '',
      course: s.courseQualification || s.courses || '',
      placementStatus: s.placementStatus || 'Awaiting',
      status: s.status || 'Active',
    }));

    return res.status(200).json({
      success: true,
      data: {
        students: mappedStudents.slice(0, 5),
        requests: allRequests.slice(0, 5),
        appointments: allAppointments.slice(0, 5),
        placements: allInternships.slice(0, 5),
        payments: payments.slice(0, 5),
        rtos: rtos.slice(0, 5),
        industries: industries.slice(0, 5),
      },
    });
  } catch (error) {
    next(error);
  }
};
