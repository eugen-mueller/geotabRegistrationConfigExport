/// <reference path="../bluebird.d.ts"/>
import * as Utils from "./utils";

const REPORT_TYPE_DASHBOAD = "Dashboard";

interface IReport {
    id: string;
    groups: IGroup[];
    includeAllChildrenGroups: IGroup[];
    includeDirectChildrenOnlyGroups: IGroup[];
    scopeGroups: IGroup[];
    destination?: string;
    template: IReportTemplate;
    lastModifiedUser;
    arguments: {
        rules?: any[];
        devices?: any[];
        zoneTypeList?: any[];
        [propName: string]: any;
    };
    [propName: string]: any;
}

interface IGroup {
    id: string;
    children: IGroup[];
}

export interface IReportDependencies {
    devices?: string[];
    rules?: string[];
    zoneTypes?: string[];
    groups?: string[];
}

interface IReportTemplate {
    id: string;
    name: string;
    isSystem: boolean;
    reportDataSource: string;
    reportTemplateType: string;
    reports: IReport[];
    binaryData?: string;
    [propName: string]: any;
}

export default class ReportsBuilder {
    private api;
    private currentTask;
    private allReports: IReport[];
    private structuredReports;
    private dashboardsLength: number;
    private allTemplates: IReportTemplate[];

    private getReports (): Promise<any> {
        return new Promise((resolve, reject) => {
            this.api.multiCall([
                ["GetReportSchedules", {
                    "includeTemplateDetails": true,
                    "applyUserFilter": false
                }],
                ["Get", {
                    "typeName": "ReportTemplate",
                    "search": {
                        includeBinaryData: false
                    }
                }],
                ["GetDashboardItems", {}]
            ], resolve, reject);
        });
    }

    private structureReports (reports, templates) {
        let findTemplateReports = (templateId) => {
                return reports.filter(report => report.template.id === templateId);
            };
        return templates.reduce((res, template) => {
            let templateId = template.id,
                templateReports = findTemplateReports(templateId);
            if (templateReports.length) {
                template.reports = templateReports;
                res.push(template);
            }
            return res;
        }, []);
    }

    private abortCurrentTask (): void {
        this.currentTask && this.currentTask.abort && this.currentTask.abort();
        this.currentTask = null;
    }

    private updateTemplate (newTemplateData: IReportTemplate) {
        this.allTemplates.some((templateData: IReportTemplate, index: number) => {
            if (templateData.id === newTemplateData.id) {
                this.allTemplates[index] = newTemplateData;
                return true;
            }
            return false;
        });
    }

    constructor(api) {
        this.api = api;
    }

    public fetch (): Promise<any> {
        this.abortCurrentTask();
        this.currentTask = this.getReports()
            .then(([reports, templates, dashboardItems]) => {
                this.allReports = reports;
                this.allTemplates = templates;
                this.dashboardsLength = dashboardItems && dashboardItems.length ? dashboardItems.length : 0;
                this.structuredReports = this.structureReports(reports, templates);
                return this.structuredReports;
            })
            .catch(console.error)
            .finally(() => {
                this.currentTask = null;
            });
        return this.currentTask;
    }

    public getDependencies (reports: IReportTemplate[]): IReportDependencies {
        let allDependencies: IReportDependencies = {
                devices: [],
                rules: [],
                zoneTypes: [],
                groups: []
            };
        return reports.reduce((reportsDependencies: IReportDependencies, template: IReportTemplate) => {
            return template.reports.reduce((templateDependecies, report) => {
                templateDependecies.groups = Utils.mergeUnique(templateDependecies.groups, Utils.getEntitiesIds(report.groups),
                    Utils.getEntitiesIds(report.includeAllChildrenGroups), Utils.getEntitiesIds(report.includeDirectChildrenOnlyGroups),
                    Utils.getEntitiesIds(report.scopeGroups));
                templateDependecies.devices = Utils.mergeUnique(templateDependecies.devices, report.arguments && report.arguments.devices && Utils.getEntitiesIds(report.arguments.devices) || []);
                templateDependecies.rules = Utils.mergeUnique(templateDependecies.rules, report.arguments && report.arguments.rules && Utils.getEntitiesIds(report.arguments.rules) || []);
                templateDependecies.zoneTypes = Utils.mergeUnique(
                    templateDependecies.zoneTypes, report.arguments && report.arguments.zoneTypeList && Utils.getEntitiesIds(report.arguments.zoneTypeList) || []);
                return templateDependecies;
            }, reportsDependencies);
        }, allDependencies);
    }

    public getData (): Promise<IReportTemplate[]> {
        let portionSize = 15,
            portions = this.allTemplates.reduce((requests, template: IReportTemplate) => {
                if (!template.isSystem && !template.binaryData) {
                    let portionIndex: number = requests.length - 1;
                    if (!requests[portionIndex] || requests[portionIndex].length >= portionSize) {
                       requests.push([]);
                       portionIndex ++;
                    }
                    requests[portionIndex].push(["Get", {
                        "typeName": "ReportTemplate",
                        "search": {
                            id: template.id,
                            includeBinaryData: true
                        }
                    }]);
                }
                return requests;
            }, []),
            totalResults: any[][] = [],
            getPortionData = portion => {
                return new Promise<any>((resolve, reject) => {
                    this.api.multiCall(portion, resolve, reject);
                });
            },
            errorPortions = [];

        this.abortCurrentTask();
        this.currentTask = portions.reduce((promises, portion) => {
                return promises
                    .then(() => getPortionData(portion))
                    .then(result => {
                            totalResults = totalResults.concat(result);
                        }, e => {
                            errorPortions = errorPortions.concat(portion);
                            console.error(e);
                        }
                    );
            }, Utils.resolvedPromise([]))
            .then(() => {
                errorPortions.length && console.warn(errorPortions);
                totalResults.forEach(templateData => {
                    let template: IReportTemplate = templateData.length ? templateData[0] : templateData;
                    this.updateTemplate(template);
                });
                this.structuredReports = this.structureReports(this.allReports, this.allTemplates);
                return this.structuredReports;
            })
            .catch(console.error)
            .finally(() => {
                this.currentTask = null;
            });
        return this.currentTask;
    }

    public getDashboardsQty (): number {
        return this.dashboardsLength;
    }

    public getCustomizedReportsQty (): number {
        let templates = [];
        return (this.allReports.filter((report: IReport) => {
            let templateId = report.template.id,
                templateExists: boolean = templates.indexOf(templateId) > -1,
                isCount: boolean = !templateExists && report.lastModifiedUser !== "NoUserId";
            isCount && templates.push(templateId);
            return isCount;
        })).length;
    }

    public unload (): void {
        this.abortCurrentTask();
    }
}