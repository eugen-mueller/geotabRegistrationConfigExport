(function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){
"use strict";
exports.__esModule = true;
var groupsBuilder_1 = require("./groupsBuilder");
var securityClearancesBuilder_1 = require("./securityClearancesBuilder");
var reportsBuilder_1 = require("./reportsBuilder");
var rulesBuilder_1 = require("./rulesBuilder");
var distributionListsBuilder_1 = require("./distributionListsBuilder");
var miscBuilder_1 = require("./miscBuilder");
var utils_1 = require("./utils");
var waiting_1 = require("./waiting");
var Addin = /** @class */ (function () {
    function Addin(api) {
        var _this = this;
        this.exportBtn = document.getElementById("exportButton");
        this.data = {
            groups: [],
            reports: [],
            rules: [],
            distributionLists: [],
            devices: [],
            users: [],
            zoneTypes: [],
            zones: [],
            workTimes: [],
            workHolidays: [],
            securityGroups: [],
            customMaps: [],
            diagnostics: [],
            misc: null,
            notificationTemplates: []
        };
        this.toggleWaiting = function (isStart) {
            if (isStart === void 0) { isStart = false; }
            if (isStart) {
                _this.toggleExportButton(true);
                _this.waiting.start(document.getElementById("addinContainer").parentElement, 9999);
            }
            else {
                _this.toggleExportButton(false);
                _this.waiting.stop();
            }
        };
        this.toggleThisAddinIncluded = function (e) {
            var isChecked = !!e.target && !!e.target.checked;
            var addinsBlock = document.getElementById("exportedAddins");
            var addinsData = _this.miscBuilder.getAddinsData(!isChecked);
            _this.showEntityMessage(addinsBlock, addinsData.length, "addin");
            _this.data.misc.addins = addinsData;
        };
        this.exportData = function () {
            _this.toggleWaiting(true);
            return _this.reportsBuilder.getData().then(function (reportsData) {
                _this.data.reports = reportsData;
                console.log(_this.data);
                utils_1.downloadDataAsFile(JSON.stringify(_this.data), "export.json");
            })["catch"](function (e) {
                alert("Can't export data.\nPlease try again later.");
                console.error(e);
            })["finally"](function () { return _this.toggleWaiting(); });
        };
        this.api = api;
        this.groupsBuilder = new groupsBuilder_1["default"](api);
        this.securityClearancesBuilder = new securityClearancesBuilder_1["default"](api);
        this.reportsBuilder = new reportsBuilder_1["default"](api);
        this.rulesBuilder = new rulesBuilder_1["default"](api);
        this.distributionListsBuilder = new distributionListsBuilder_1["default"](api);
        this.miscBuilder = new miscBuilder_1.MiscBuilder(api);
        this.waiting = new waiting_1["default"]();
    }
    Addin.prototype.combineDependencies = function () {
        var allDependencies = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            allDependencies[_i] = arguments[_i];
        }
        var total = {
            groups: [],
            reports: [],
            rules: [],
            devices: [],
            users: [],
            zoneTypes: [],
            zones: [],
            workTimes: [],
            workHolidays: [],
            securityGroups: [],
            diagnostics: [],
            customMaps: [],
            notificationTemplates: []
        };
        return Object.keys(total).reduce(function (dependencies, dependencyName) {
            dependencies[dependencyName] = utils_1.mergeUnique.apply(void 0, [dependencies[dependencyName]].concat(allDependencies.map(function (entityDependencies) { return entityDependencies[dependencyName]; })));
            return dependencies;
        }, total);
    };
    Addin.prototype.addNewGroups = function (groups, data) {
        if (!groups || !groups.length) {
            return utils_1.resolvedPromise();
        }
        var groupsData = this.groupsBuilder.getGroupsData(groups, true), newGroupsUsers = utils_1.getUniqueEntities(this.groupsBuilder.getPrivateGroupsUsers(groupsData), data.users);
        data.groups = utils_1.mergeUniqueEntities(data.groups, groupsData);
        data.users = utils_1.mergeUniqueEntities(data.users, newGroupsUsers);
        return this.resolveDependencies({ users: utils_1.getEntitiesIds(newGroupsUsers) }, data);
    };
    Addin.prototype.addNewCustomMaps = function (customMapsIds, data) {
        var _this = this;
        if (!customMapsIds || !customMapsIds.length) {
            return false;
        }
        var customMapsData = customMapsIds.reduce(function (data, customMapId) {
            var customMapData = _this.miscBuilder.getMapProviderData(customMapId);
            customMapData && data.push(customMapData);
            return data;
        }, []);
        data.customMaps = utils_1.mergeUniqueEntities(data.customMaps, customMapsData);
    };
    Addin.prototype.addNewNotificationTemplates = function (notificationTemplatesIds, data) {
        var _this = this;
        if (!notificationTemplatesIds || !notificationTemplatesIds.length) {
            return false;
        }
        var notificationTemplatesData = notificationTemplatesIds.reduce(function (data, templateId) {
            var templateData = _this.distributionListsBuilder.getNotificationTemplateData(templateId);
            templateData && data.push(templateData);
            return data;
        }, []);
        data.notificationTemplates = utils_1.mergeUniqueEntities(data.notificationTemplates, notificationTemplatesData);
    };
    Addin.prototype.getEntytiesIds = function (entities) {
        return entities.reduce(function (res, entity) {
            entity && entity.id && res.push(entity.id);
            return res;
        }, []);
    };
    Addin.prototype.getEntityDependencies = function (entity, entityType) {
        var entityDependencies = {};
        switch (entityType) {
            case "devices":
                entityDependencies.groups = this.getEntytiesIds(entity["groups"].concat(entity["autoGroups"]));
                entity["workTime"].id && (entityDependencies.workTimes = [entity["workTime"].id]);
                break;
            case "users":
                entityDependencies.groups = this.getEntytiesIds(entity["companyGroups"].concat(entity["driverGroups"]).concat(entity["privateUserGroups"]).concat(entity["reportGroups"]));
                entityDependencies.securityGroups = this.getEntytiesIds(entity["securityGroups"]);
                entityDependencies.customMaps = [entity["defaultMapEngine"]];
                break;
            case "zones":
                var zoneTypes = this.getEntytiesIds(entity["zoneTypes"]);
                zoneTypes.length && (entityDependencies.zoneTypes = zoneTypes);
                entityDependencies.groups = this.getEntytiesIds(entity["groups"]);
                break;
            case "workTimes":
                entity["holidayGroup"].groupId && (entityDependencies.workHolidays = [entity["holidayGroup"].groupId]);
                break;
            default:
                break;
        }
        return entityDependencies;
    };
    Addin.prototype.applyToEntities = function (entitiesList, initialValue, func) {
        var overallIndex = 0;
        return Object.keys(entitiesList).reduce(function (result, entityType, typeIndex) {
            return entitiesList[entityType].reduce(function (res, entity, index) {
                overallIndex++;
                return func(res, entity, entityType, index, typeIndex, overallIndex - 1);
            }, result);
        }, initialValue);
    };
    Addin.prototype.resolveDependencies = function (dependencies, data) {
        var _this = this;
        var getData = function (entitiesList) {
            var entityRequestTypes = {
                devices: "Device",
                users: "User",
                zoneTypes: "ZoneType",
                zones: "Zone",
                workTimes: "WorkTime",
                workHolidays: "WorkHoliday",
                securityGroups: "Group",
                diagnostics: "Diagnostic"
            }, requests = _this.applyToEntities(entitiesList, {}, function (result, entityId, entityType) {
                var request = {
                    typeName: entityRequestTypes[entityType],
                    search: {
                        id: entityId
                    }
                };
                if (entityRequestTypes[entityType]) {
                    if (entityType === "workHolidays" || entityType === "securityGroups") {
                        return result;
                    }
                    !result[entityType] && (result[entityType] = []);
                    result[entityType].push(["Get", request]);
                }
                return result;
            });
            if (entitiesList.securityGroups && entitiesList.securityGroups.length) {
                requests.securityGroups = [["Get", {
                            typeName: entityRequestTypes.securityGroups,
                            search: {
                                id: "GroupSecurityId"
                            }
                        }]];
            }
            if (entitiesList.workHolidays && entitiesList.workHolidays.length) {
                requests.workHolidays = [["Get", {
                            typeName: entityRequestTypes.workHolidays
                        }]];
            }
            return _this.addNewGroups(entitiesList.groups, data).then(function () {
                _this.addNewCustomMaps(entitiesList.customMaps, data);
                _this.addNewNotificationTemplates(entitiesList.notificationTemplates, data);
                delete entitiesList.groups;
                delete entitiesList.customMaps;
                return new Promise(function (resolve, reject) {
                    var requestEntities = Object.keys(requests), requestsArray = requestEntities.reduce(function (list, type) { return list.concat(requests[type]); }, []);
                    if (!requestEntities.length) {
                        return resolve(data);
                    }
                    _this.api.multiCall(requestsArray, function (response) {
                        var newGroups = [], newCustomMaps = [], newDependencies = {}, exportedData = _this.applyToEntities(requests, {}, function (result, request, entityType, entityIndex, entityTypeIndex, overallIndex) {
                            var items = requestsArray.length > 1 ? response[overallIndex] : response;
                            items.forEach(function (item) {
                                item = item[0] || item;
                                !result[entityType] && (result[entityType] = []);
                                if (entityType === "workHolidays" && (!item.holidayGroup || entitiesList.workHolidays.indexOf(item.holidayGroup.groupId) === -1)) {
                                    return false;
                                }
                                else if (entityType === "securityGroups") {
                                    if (entitiesList.securityGroups.indexOf(item.id) > -1) {
                                        result[entityType] = result[entityType].concat(_this.groupsBuilder.getCustomGroupsData(entitiesList.securityGroups, items));
                                        return result;
                                    }
                                    return false;
                                }
                                else if (entityType === "users") {
                                    item.userAuthenticationType = "BasicAuthentication";
                                }
                                var entityDependencies = _this.getEntityDependencies(item, entityType);
                                newDependencies = _this.applyToEntities(entityDependencies, newDependencies, function (result, entityId, entityType) {
                                    !result[entityType] && (result[entityType] = []);
                                    result[entityType] = utils_1.mergeUnique(result[entityType], [entityId]);
                                    return result;
                                });
                                newGroups = newGroups.concat(newDependencies.groups || []);
                                newCustomMaps = newCustomMaps.concat(newDependencies.customMaps || []);
                                delete newDependencies.groups;
                                delete newDependencies.customMaps;
                                result[entityType].push(item);
                            });
                            return result;
                        });
                        newDependencies = Object.keys(newDependencies).reduce(function (result, dependencyName) {
                            var entities = newDependencies[dependencyName], exported = (exportedData[dependencyName] || []).map(function (entity) { return entity.id; });
                            entities.forEach(function (entityId) {
                                if (exported.indexOf(entityId) === -1) {
                                    !result[dependencyName] && (result[dependencyName] = []);
                                    result[dependencyName].push(entityId);
                                }
                            });
                            return result;
                        }, {});
                        // Remove built-in security groups
                        exportedData.securityGroups && (exportedData.securityGroups = exportedData.securityGroups.reduce(function (result, group) {
                            group.id.indexOf("Group") === -1 && result.push(group);
                            return result;
                        }, []));
                        _this.addNewGroups(newGroups, data).then(function () {
                            _this.addNewCustomMaps(newCustomMaps, data);
                            Object.keys(exportedData).forEach(function (entityType) {
                                data[entityType] = utils_1.mergeUniqueEntities(data[entityType], exportedData[entityType]);
                            });
                            if (Object.keys(newDependencies).length) {
                                resolve(_this.resolveDependencies(newDependencies, data));
                            }
                            else {
                                resolve(data);
                            }
                        }, reject);
                    }, reject);
                });
            });
        };
        return new Promise(function (resolve, reject) {
            return getData(dependencies).then(resolve)["catch"](reject);
        });
    };
    Addin.prototype.abortCurrentTask = function () {
        this.toggleWaiting();
        this.currentTask && this.currentTask.abort && this.currentTask.abort();
        this.currentTask = null;
    };
    Addin.prototype.toggleExportButton = function (isDisabled) {
        this.exportBtn.disabled = isDisabled;
    };
    Addin.prototype.showEntityMessage = function (block, qty, entityName) {
        var blockEl = block.querySelector(".description");
        if (qty) {
            qty > 1 && (entityName += "s");
            var hasItemsMessageTemplate = document.getElementById("hasItemsMessageTemplate").innerHTML;
            blockEl.innerHTML = hasItemsMessageTemplate.replace("{quantity}", qty.toString()).replace("{entity}", entityName);
        }
        else {
            blockEl.innerHTML = "You have <span class=\"bold\">not configured any " + entityName + "s</span>.";
        }
    };
    Addin.prototype.render = function () {
        var _this = this;
        var mapMessageTemplate = document.getElementById("mapMessageTemplate").innerHTML, groupsBlock = document.getElementById("exportedGroups"), securityClearancesBlock = document.getElementById("exportedSecurityClearances"), rulesBlock = document.getElementById("exportedRules"), reportsBlock = document.getElementById("exportedReports"), dashboardsBlock = document.getElementById("exportedDashboards"), addinsBlock = document.getElementById("exportedAddins"), thisAddinBlock = document.getElementById("includeThisAddin"), thisAddinIncludedCheckbox = document.querySelector("#includeThisAddin > input"), mapBlockDescription = document.querySelector("#exportedMap > .description");
        this.exportBtn.addEventListener("click", this.exportData, false);
        thisAddinIncludedCheckbox.addEventListener("change", this.toggleThisAddinIncluded, false);
        this.toggleWaiting(true);
        return utils_1.together([
            this.groupsBuilder.fetch(),
            this.securityClearancesBuilder.fetch(),
            this.reportsBuilder.fetch(),
            this.rulesBuilder.fetch(),
            this.distributionListsBuilder.fetch(),
            this.miscBuilder.fetch()
        ]).then(function (results) {
            var reportsDependencies, rulesDependencies, distributionListsDependencies, dependencies, customMap;
            _this.data.groups = results[0];
            _this.data.securityGroups = results[1];
            _this.data.reports = results[2];
            _this.data.rules = results[3];
            _this.data.distributionLists = _this.distributionListsBuilder.getRulesDistributionLists(_this.data.rules.map(function (rule) { return rule.id; }));
            _this.data.misc = results[5];
            customMap = _this.miscBuilder.getMapProviderData(_this.data.misc.mapProvider.value);
            customMap && _this.data.customMaps.push(customMap);
            reportsDependencies = _this.reportsBuilder.getDependencies(_this.data.reports);
            rulesDependencies = _this.rulesBuilder.getDependencies(_this.data.rules);
            distributionListsDependencies = _this.distributionListsBuilder.getDependencies(_this.data.distributionLists);
            dependencies = _this.combineDependencies(reportsDependencies, rulesDependencies, distributionListsDependencies);
            return _this.resolveDependencies(dependencies, _this.data);
        }).then(function () {
            var mapProvider = _this.miscBuilder.getMapProviderName(_this.data.misc.mapProvider.value);
            _this.showEntityMessage(groupsBlock, _this.data.groups.length - 1, "group");
            _this.showEntityMessage(securityClearancesBlock, _this.data.securityGroups.length, "security clearance");
            _this.showEntityMessage(rulesBlock, _this.data.rules.length, "rule");
            _this.showEntityMessage(reportsBlock, _this.reportsBuilder.getCustomizedReportsQty(), "report");
            _this.showEntityMessage(dashboardsBlock, _this.reportsBuilder.getDashboardsQty(), "dashboard");
            mapProvider && (mapBlockDescription.innerHTML = mapMessageTemplate.replace("{mapProvider}", mapProvider));
            _this.showEntityMessage(addinsBlock, _this.data.misc.addins.length, "addin");
            _this.miscBuilder.isThisAddinIncluded() && thisAddinBlock.classList.remove("hidden");
            console.log(_this.data);
        })["catch"](function (e) {
            console.error(e);
            alert("Can't get config to export");
        })["finally"](function () { return _this.toggleWaiting(); });
    };
    Addin.prototype.unload = function () {
        this.abortCurrentTask();
        this.groupsBuilder.unload();
        this.securityClearancesBuilder.unload();
        this.reportsBuilder.unload();
        this.rulesBuilder.unload();
        this.distributionListsBuilder.unload();
        this.miscBuilder.unload();
        this.exportBtn.removeEventListener("click", this.exportData, false);
    };
    return Addin;
}());
geotab.addin.registrationConfig = function () {
    var addin;
    return {
        initialize: function (api, state, callback) {
            addin = new Addin(api);
            callback();
        },
        focus: function () {
            addin.render();
        },
        blur: function () {
            addin.unload();
        }
    };
};
},{"./distributionListsBuilder":2,"./groupsBuilder":3,"./miscBuilder":4,"./reportsBuilder":5,"./rulesBuilder":6,"./securityClearancesBuilder":7,"./utils":8,"./waiting":9}],2:[function(require,module,exports){
"use strict";
exports.__esModule = true;
/// <reference path="../bluebird.d.ts"/>
var utils_1 = require("./utils");
var DistributionListsBuilder = /** @class */ (function () {
    function DistributionListsBuilder(api) {
        this.api = api;
    }
    DistributionListsBuilder.prototype.getDistributionListsData = function () {
        var _this = this;
        return new Promise(function (resolve, reject) {
            _this.api.multiCall([
                ["Get", {
                        "typeName": "DistributionList"
                    }],
                ["GetNotificationWebRequestTemplates", {}],
                ["GetNotificationEmailTemplates", {}],
                ["GetNotificationTextTemplates", {}]
            ], resolve, reject);
        });
    };
    ;
    DistributionListsBuilder.prototype.abortCurrentTask = function () {
        this.currentTask && this.currentTask.abort && this.currentTask.abort();
        this.currentTask = null;
    };
    ;
    DistributionListsBuilder.prototype.getDependencies = function (distributionLists) {
        var dependencies = {
            rules: [],
            users: [],
            groups: [],
            notificationTemplates: []
        }, processDependencies = function (recipient) {
            var id, type, userId = recipient.user.id;
            userId && dependencies.users.indexOf(userId) === -1 && dependencies.users.push(userId);
            switch (recipient.recipientType) {
                case "Email":
                case "LogPopup":
                case "LogUrgentPopup":
                case "LogOnly":
                case "TextMessage":
                case "TextToSpeechAllowDelay":
                case "WebRequest":
                case "TextToSpeech":
                    id = recipient.notificationBinaryFile && recipient.notificationBinaryFile.id;
                    type = "notificationTemplates";
                    break;
                case "AssignToGroup":
                    id = recipient.group && recipient.group.id;
                    type = "groups";
                    break;
            }
            id && type && dependencies[type].indexOf(id) === -1 && dependencies[type].push(id);
        }, checkRecipients = function (recipients, dependencies) {
            return recipients.reduce(function (dependencies, recipient) {
                processDependencies(recipient);
                return dependencies;
            }, dependencies);
        };
        return distributionLists.reduce(function (dependencies, distributionList) {
            dependencies.rules = utils_1.mergeUnique(dependencies.rules, distributionList.rules.map(function (rule) { return rule.id; }));
            dependencies = checkRecipients(distributionList.recipients, dependencies);
            return dependencies;
        }, dependencies);
    };
    ;
    DistributionListsBuilder.prototype.fetch = function () {
        var _this = this;
        this.abortCurrentTask();
        this.currentTask = this.getDistributionListsData()
            .then(function (_a) {
            var distributionLists = _a[0], webTemplates = _a[1], emailTemplates = _a[2], textTemplates = _a[3];
            _this.distributionLists = utils_1.entityToDictionary(distributionLists);
            _this.notificationTemplates = utils_1.entityToDictionary(webTemplates.concat(emailTemplates).concat(textTemplates));
            return _this.distributionLists;
        })["catch"](console.error)["finally"](function () {
            _this.currentTask = null;
        });
        return this.currentTask;
    };
    ;
    DistributionListsBuilder.prototype.getNotificationTemplateData = function (templateId) {
        return this.notificationTemplates[templateId];
    };
    ;
    DistributionListsBuilder.prototype.getRulesDistributionLists = function (rulesIds) {
        var _this = this;
        return Object.keys(this.distributionLists).reduce(function (res, id) {
            var list = _this.distributionLists[id];
            list.rules.some(function (listRule) { return rulesIds.indexOf(listRule.id) > -1; }) && res.push(list);
            return res;
        }, []);
    };
    ;
    DistributionListsBuilder.prototype.unload = function () {
        this.abortCurrentTask();
    };
    ;
    return DistributionListsBuilder;
}());
exports["default"] = DistributionListsBuilder;
},{"./utils":8}],3:[function(require,module,exports){
"use strict";
exports.__esModule = true;
/// <reference path="../bluebird.d.ts"/>
var Utils = require("./utils");
var GroupsBuilder = /** @class */ (function () {
    function GroupsBuilder(api) {
        this.api = api;
    }
    GroupsBuilder.prototype.getGroups = function () {
        var _this = this;
        return new Promise(function (resolve, reject) {
            _this.api.getSession(function (sessionData) {
                _this.currentUserName = sessionData.userName;
                _this.api.multiCall([
                    ["Get", {
                            typeName: "Group"
                        }],
                    ["Get", {
                            typeName: "User"
                        }]
                ], resolve, reject);
            });
        });
    };
    ;
    GroupsBuilder.prototype.findChild = function (childId, currentItem, onAllLevels) {
        var _this = this;
        if (onAllLevels === void 0) { onAllLevels = false; }
        var foundChild = null, children = currentItem.children;
        if (!childId || !children || !children.length) {
            return null;
        }
        children.some(function (child) {
            if (child.id === childId) {
                foundChild = child;
                return foundChild;
            }
            else {
                if (onAllLevels) {
                    foundChild = _this.findChild(childId, child, onAllLevels);
                    return foundChild;
                }
                else {
                    return false;
                }
            }
        });
        return foundChild;
    };
    ;
    GroupsBuilder.prototype.getUserByPrivateGroupId = function (groupId) {
        var outputUser = null, userHasPrivateGroup = function (user, groupId) {
            return user.privateUserGroups.some(function (group) {
                if (group.id === groupId) {
                    return true;
                }
            });
        };
        this.users.some(function (user) {
            if (userHasPrivateGroup(user, groupId)) {
                outputUser = user;
                return true;
            }
        });
        return outputUser;
    };
    ;
    GroupsBuilder.prototype.getPrivateGroupData = function (groupId) {
        return {
            id: groupId,
            user: this.getUserByPrivateGroupId(groupId),
            children: [],
            name: "PrivateUserGroupName",
            parent: {
                id: "GroupPrivateUserId",
                children: [{ id: groupId }]
            }
        };
    };
    ;
    GroupsBuilder.prototype.createGroupsTree = function (groups) {
        var nodeLookup, traverseChildren = function (node) {
            var children, id;
            children = node.children;
            if (children) {
                for (var i = 0, ii = children.length; i < ii; i += 1) {
                    id = children[i].id;
                    if (nodeLookup[id]) {
                        node.children[i] = nodeLookup[id];
                        node.children[i].parent = node;
                        delete nodeLookup[id];
                    }
                    traverseChildren(node.children[i]);
                }
            }
        };
        nodeLookup = Utils.entityToDictionary(groups, function (entity) {
            var newEntity = Utils.extend({}, entity);
            if (newEntity.children) {
                newEntity.children = newEntity.children.slice();
            }
            return newEntity;
        });
        Object.keys(nodeLookup).forEach(function (key) {
            nodeLookup[key] && traverseChildren(nodeLookup[key]);
        });
        return Object.keys(nodeLookup).map(function (key) {
            return nodeLookup[key];
        });
    };
    ;
    GroupsBuilder.prototype.abortCurrentTask = function () {
        this.currentTask && this.currentTask.abort && this.currentTask.abort();
        this.currentTask = null;
    };
    ;
    GroupsBuilder.prototype.fetch = function () {
        var _this = this;
        this.abortCurrentTask();
        this.currentTask = this.getGroups()
            .then(function (_a) {
            var groups = _a[0], users = _a[1];
            _this.groups = groups;
            _this.users = users;
            _this.tree = _this.createGroupsTree(groups);
            _this.currentTree = Utils.extend({}, _this.tree);
            return _this.createFlatGroupsList(_this.tree);
        })["catch"](console.error)["finally"](function () {
            _this.currentTask = null;
        });
        return this.currentTask;
    };
    ;
    GroupsBuilder.prototype.createFlatGroupsList = function (groups, notIncludeChildren) {
        if (notIncludeChildren === void 0) { notIncludeChildren = false; }
        var foundIds = [], groupsToAdd = [], makeFlatParents = function (item) {
            var itemCopy = Utils.extend({}, item);
            if (item && item.parent) {
                makeFlatParents(item.parent);
            }
            itemCopy.children = itemCopy.children.map(function (child) { return child.id; });
            itemCopy.parent = item.parent ? { id: item.parent.id, name: item.parent.name } : null;
            if (foundIds.indexOf(item.id) === -1) {
                groupsToAdd.push(itemCopy);
                foundIds.push(item.id);
            }
        }, makeFlatChildren = function (item) {
            if (item && item.children && item.children.length) {
                item.children.forEach(function (child) {
                    var childCopy;
                    if (foundIds.indexOf(child.id) === -1) {
                        makeFlatChildren(child);
                    }
                    childCopy = Utils.extend({}, child);
                    childCopy.children = childCopy.children.map(function (childInner) { return childInner.id; });
                    childCopy.parent = childCopy.parent ? { id: childCopy.parent.id, name: childCopy.parent.name } : null;
                    if (foundIds.indexOf(child.id) === -1) {
                        groupsToAdd.push(childCopy);
                        foundIds.push(child.id);
                    }
                });
            }
        };
        groups.forEach(makeFlatParents);
        !notIncludeChildren && groups.forEach(makeFlatChildren);
        return groupsToAdd;
    };
    ;
    GroupsBuilder.prototype.getGroupsData = function (groupIds, notIncludeChildren) {
        var _this = this;
        if (notIncludeChildren === void 0) { notIncludeChildren = false; }
        var treeGroups = groupIds.map(function (groupId) {
            return _this.findChild(groupId, { id: null, children: _this.tree }, true) || _this.getPrivateGroupData(groupId);
        });
        return this.createFlatGroupsList(treeGroups, notIncludeChildren);
    };
    ;
    GroupsBuilder.prototype.getCustomGroupsData = function (groupIds, allGroups) {
        var _this = this;
        var groupsTree = this.createGroupsTree(allGroups), treeGroups = groupIds.map(function (groupId) {
            return _this.findChild(groupId, { id: null, children: groupsTree }, true) || _this.getPrivateGroupData(groupId);
        });
        return this.createFlatGroupsList(treeGroups, true);
    };
    ;
    GroupsBuilder.prototype.getPrivateGroupsUsers = function (groups) {
        var _this = this;
        return groups.reduce(function (users, group) {
            group.user && group.user.name !== _this.currentUserName && users.push(group.user);
            return users;
        }, []);
    };
    ;
    GroupsBuilder.prototype.unload = function () {
        this.abortCurrentTask();
    };
    ;
    return GroupsBuilder;
}());
exports["default"] = GroupsBuilder;
},{"./utils":8}],4:[function(require,module,exports){
"use strict";
exports.__esModule = true;
var utils_1 = require("./utils");
var MiscBuilder = /** @class */ (function () {
    function MiscBuilder(api) {
        this.defaultMapProviders = {
            GoogleMaps: "Google Maps",
            Here: "HERE Maps",
            MapBox: "MapBox"
        };
        this.api = api;
    }
    MiscBuilder.prototype.abortCurrentTask = function () {
        this.currentTask && this.currentTask.abort && this.currentTask.abort();
        this.currentTask = null;
    };
    MiscBuilder.prototype.getAllowedAddins = function (allAddins) {
        return allAddins.filter(function (addin) {
            var addinConfig = JSON.parse(addin);
            return addinConfig && Array.isArray(addinConfig.items) && addinConfig.items.every(function (item) {
                var url = item.url;
                return url && url.indexOf("\/\/") > -1;
            });
        });
    };
    MiscBuilder.prototype.isCurrentAddin = function (addin) {
        return addin.indexOf("Registration config") > -1;
    };
    MiscBuilder.prototype.fetch = function () {
        var _this = this;
        this.abortCurrentTask();
        this.currentTask = new Promise(function (resolve, reject) {
            _this.api.getSession(function (sessionData) {
                var userName = sessionData.userName;
                _this.api.multiCall([
                    ["Get", {
                            typeName: "User",
                            search: {
                                name: userName
                            }
                        }],
                    ["Get", {
                            typeName: "SystemSettings"
                        }]
                ], resolve, reject);
            });
        }).then(function (result) {
            var currentUser = result[0][0] || result[0], systemSettings = result[1][0] || result[1], userMapProviderId = currentUser.defaultMapEngine, defaultMapProviderId = systemSettings.mapProvider, mapProviderId = _this.getMapProviderType(userMapProviderId) === "custom" ? userMapProviderId : defaultMapProviderId;
            _this.currentUser = currentUser;
            _this.customMapProviders = utils_1.entityToDictionary(systemSettings.customWebMapProviderList);
            _this.isUnsignedAddinsAllowed = systemSettings.allowUnsignedAddIn;
            _this.addins = _this.getAllowedAddins(systemSettings.customerPages);
            return {
                mapProvider: {
                    value: mapProviderId,
                    type: _this.getMapProviderType(mapProviderId)
                },
                currentUser: _this.currentUser,
                isUnsignedAddinsAllowed: _this.isUnsignedAddinsAllowed,
                addins: _this.addins
            };
        });
        return this.currentTask;
    };
    MiscBuilder.prototype.getMapProviderType = function (mapProviderId) {
        return this.defaultMapProviders[mapProviderId] ? "default" : "custom";
    };
    MiscBuilder.prototype.getMapProviderName = function (mapProviderId) {
        return mapProviderId && (this.defaultMapProviders[mapProviderId] || (this.customMapProviders[mapProviderId] && this.customMapProviders[mapProviderId].name) || mapProviderId);
    };
    MiscBuilder.prototype.getMapProviderData = function (mapProviderId) {
        return mapProviderId && this.customMapProviders[mapProviderId];
    };
    MiscBuilder.prototype.isThisAddinIncluded = function () {
        return this.addins.some(this.isCurrentAddin);
    };
    MiscBuilder.prototype.getAddinsData = function (includeThisAddin) {
        var _this = this;
        if (includeThisAddin === void 0) { includeThisAddin = true; }
        return !includeThisAddin ? this.addins.filter(function (addin) { return !_this.isCurrentAddin(addin); }) : this.addins;
    };
    MiscBuilder.prototype.unload = function () {
        this.abortCurrentTask();
    };
    return MiscBuilder;
}());
exports.MiscBuilder = MiscBuilder;
},{"./utils":8}],5:[function(require,module,exports){
"use strict";
exports.__esModule = true;
/// <reference path="../bluebird.d.ts"/>
var Utils = require("./utils");
var REPORT_TYPE_DASHBOAD = "Dashboard";
var ReportsBuilder = /** @class */ (function () {
    function ReportsBuilder(api) {
        this.api = api;
    }
    ReportsBuilder.prototype.getReports = function () {
        var _this = this;
        return new Promise(function (resolve, reject) {
            _this.api.multiCall([
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
    };
    ReportsBuilder.prototype.structureReports = function (reports, templates) {
        var findTemplateReports = function (templateId) {
            return reports.filter(function (report) { return report.template.id === templateId; });
        };
        return templates.reduce(function (res, template) {
            var templateId = template.id, templateReports = findTemplateReports(templateId);
            if (templateReports.length) {
                template.reports = templateReports;
                res.push(template);
            }
            return res;
        }, []);
    };
    ReportsBuilder.prototype.abortCurrentTask = function () {
        this.currentTask && this.currentTask.abort && this.currentTask.abort();
        this.currentTask = null;
    };
    ReportsBuilder.prototype.updateTemplate = function (newTemplateData) {
        var _this = this;
        this.allTemplates.some(function (templateData, index) {
            if (templateData.id === newTemplateData.id) {
                _this.allTemplates[index] = newTemplateData;
                return true;
            }
            return false;
        });
    };
    ReportsBuilder.prototype.fetch = function () {
        var _this = this;
        this.abortCurrentTask();
        this.currentTask = this.getReports()
            .then(function (_a) {
            var reports = _a[0], templates = _a[1], dashboardItems = _a[2];
            _this.allReports = reports;
            _this.allTemplates = templates;
            _this.dashboardsLength = dashboardItems && dashboardItems.length ? dashboardItems.length : 0;
            _this.structuredReports = _this.structureReports(reports, templates);
            return _this.structuredReports;
        })["catch"](console.error)["finally"](function () {
            _this.currentTask = null;
        });
        return this.currentTask;
    };
    ReportsBuilder.prototype.getDependencies = function (reports) {
        var allDependencies = {
            devices: [],
            rules: [],
            zoneTypes: [],
            groups: []
        };
        return reports.reduce(function (reportsDependencies, template) {
            return template.reports.reduce(function (templateDependecies, report) {
                templateDependecies.groups = Utils.mergeUnique(templateDependecies.groups, Utils.getEntitiesIds(report.groups), Utils.getEntitiesIds(report.includeAllChildrenGroups), Utils.getEntitiesIds(report.includeDirectChildrenOnlyGroups), Utils.getEntitiesIds(report.scopeGroups));
                templateDependecies.devices = Utils.mergeUnique(templateDependecies.devices, report.arguments && report.arguments.devices && Utils.getEntitiesIds(report.arguments.devices) || []);
                templateDependecies.rules = Utils.mergeUnique(templateDependecies.rules, report.arguments && report.arguments.rules && Utils.getEntitiesIds(report.arguments.rules) || []);
                templateDependecies.zoneTypes = Utils.mergeUnique(templateDependecies.zoneTypes, report.arguments && report.arguments.zoneTypeList && Utils.getEntitiesIds(report.arguments.zoneTypeList) || []);
                return templateDependecies;
            }, reportsDependencies);
        }, allDependencies);
    };
    ReportsBuilder.prototype.getData = function () {
        var _this = this;
        var portionSize = 15, portions = this.allTemplates.reduce(function (requests, template) {
            if (!template.isSystem && !template.binaryData) {
                var portionIndex = requests.length - 1;
                if (!requests[portionIndex] || requests[portionIndex].length >= portionSize) {
                    requests.push([]);
                    portionIndex++;
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
        }, []), totalResults = [], getPortionData = function (portion) {
            return new Promise(function (resolve, reject) {
                _this.api.multiCall(portion, resolve, reject);
            });
        }, errorPortions = [];
        this.abortCurrentTask();
        this.currentTask = portions.reduce(function (promises, portion) {
            return promises
                .then(function () { return getPortionData(portion); })
                .then(function (result) {
                totalResults = totalResults.concat(result);
            }, function (e) {
                errorPortions = errorPortions.concat(portion);
                console.error(e);
            });
        }, Utils.resolvedPromise([]))
            .then(function () {
            errorPortions.length && console.warn(errorPortions);
            totalResults.forEach(function (templateData) {
                var template = templateData.length ? templateData[0] : templateData;
                _this.updateTemplate(template);
            });
            _this.structuredReports = _this.structureReports(_this.allReports, _this.allTemplates);
            return _this.structuredReports;
        })["catch"](console.error)["finally"](function () {
            _this.currentTask = null;
        });
        return this.currentTask;
    };
    ReportsBuilder.prototype.getDashboardsQty = function () {
        return this.dashboardsLength;
    };
    ReportsBuilder.prototype.getCustomizedReportsQty = function () {
        var templates = [];
        return (this.allReports.filter(function (report) {
            var templateId = report.template.id, templateExists = templates.indexOf(templateId) > -1, isCount = !templateExists && report.lastModifiedUser !== "NoUserId";
            isCount && templates.push(templateId);
            return isCount;
        })).length;
    };
    ReportsBuilder.prototype.unload = function () {
        this.abortCurrentTask();
    };
    return ReportsBuilder;
}());
exports["default"] = ReportsBuilder;
},{"./utils":8}],6:[function(require,module,exports){
"use strict";
exports.__esModule = true;
/// <reference path="../bluebird.d.ts"/>
var utils_1 = require("./utils");
var APPLICATION_RULE_ID = "RuleApplicationExceptionId";
var RulesBuilder = /** @class */ (function () {
    function RulesBuilder(api) {
        this.api = api;
    }
    RulesBuilder.prototype.getRules = function () {
        var _this = this;
        return new Promise(function (resolve, reject) {
            _this.api.call("Get", {
                "typeName": "Rule"
            }, resolve, reject);
        });
    };
    RulesBuilder.prototype.structureRules = function (rules) {
        return utils_1.sortArrayOfEntities(rules, [["baseType", "desc"], "name"]);
    };
    RulesBuilder.prototype.abortCurrentTask = function () {
        this.currentTask && this.currentTask.abort && this.currentTask.abort();
        this.currentTask = null;
    };
    RulesBuilder.prototype.getDependencies = function (rules) {
        var dependencies = {
            devices: [],
            users: [],
            zones: [],
            zoneTypes: [],
            workTimes: [],
            groups: [],
            diagnostics: []
        }, processDependencies = function (condition) {
            var id, type;
            switch (condition.conditionType) {
                case "RuleWorkHours":
                case "AfterRuleWorkHours":
                    id = (condition.workTime && condition.workTime.id) || condition.workTime;
                    type = "workTimes";
                    break;
                case "Driver":
                    id = condition.driver && condition.driver.id;
                    type = "users";
                    break;
                case "Device":
                    id = condition.device && condition.device.id;
                    type = "devices";
                    break;
                case "EnteringArea":
                case "ExitingArea":
                case "OutsideArea":
                case "InsideArea":
                    if (condition.zone) {
                        id = condition.zone.id || condition.zone;
                        type = "zones";
                    }
                    else {
                        id = condition.zoneType.id;
                        type = "zoneTypes";
                    }
                    break;
                case "FilterStatusDataByDiagnostic":
                case "ActiveOrInactiveFault":
                case "Fault":
                    if (condition.diagnostic) {
                        id = condition.diagnostic.id || condition.diagnostic;
                        type = "diagnostics";
                    }
                    break;
                default:
                    break;
            }
            id && type && dependencies[type].indexOf(id) === -1 && dependencies[type].push(id);
        }, checkConditions = function (parentCondition, dependencies) {
            var conditions = parentCondition.children || [];
            processDependencies(parentCondition);
            return conditions.reduce(function (dependencies, condition) {
                if (condition.children) {
                    dependencies = checkConditions(condition, dependencies);
                }
                processDependencies(condition);
                return dependencies;
            }, dependencies);
        };
        return rules.reduce(function (dependencies, rule) {
            dependencies.groups = utils_1.mergeUnique(dependencies.groups, rule.groups.map(function (group) { return group.id; }));
            if (rule.condition) {
                dependencies = checkConditions(rule.condition, dependencies);
            }
            return dependencies;
        }, dependencies);
    };
    RulesBuilder.prototype.fetch = function () {
        var _this = this;
        this.abortCurrentTask();
        this.currentTask = this.getRules()
            .then(function (switchedOnRules) {
            _this.combinedRules = utils_1.entityToDictionary(switchedOnRules);
            delete (_this.combinedRules[APPLICATION_RULE_ID]);
            _this.structuredRules = _this.structureRules(Object.keys(_this.combinedRules).map(function (key) { return _this.combinedRules[key]; }));
            return Object.keys(_this.combinedRules).map(function (ruleId) { return _this.combinedRules[ruleId]; });
        })["catch"](console.error)["finally"](function () {
            _this.currentTask = null;
        });
        return this.currentTask;
    };
    RulesBuilder.prototype.getRulesData = function (rulesIds) {
        var _this = this;
        return rulesIds.map(function (ruleId) { return _this.combinedRules[ruleId]; });
    };
    RulesBuilder.prototype.unload = function () {
        this.abortCurrentTask();
    };
    return RulesBuilder;
}());
exports["default"] = RulesBuilder;
},{"./utils":8}],7:[function(require,module,exports){
"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
exports.__esModule = true;
/// <reference path="../bluebird.d.ts"/>
var groupsBuilder_1 = require("./groupsBuilder");
var Utils = require("./utils");
var SecurityClearancesBuilder = /** @class */ (function (_super) {
    __extends(SecurityClearancesBuilder, _super);
    function SecurityClearancesBuilder(api) {
        return _super.call(this, api) || this;
    }
    SecurityClearancesBuilder.prototype.getSecurityGroups = function () {
        var _this = this;
        return new Promise(function (resolve, reject) {
            _this.api.getSession(function (sessionData) {
                _this.api.call("Get", {
                    typeName: "Group",
                    search: {
                        id: "GroupSecurityId"
                    }
                }, resolve, reject);
            });
        });
    };
    ;
    SecurityClearancesBuilder.prototype.fetch = function () {
        var _this = this;
        this.abortCurrentTask();
        this.currentTask = this.getSecurityGroups()
            .then(function (groups) {
            _this.groups = groups;
            _this.tree = _this.createGroupsTree(groups);
            _this.currentTree = Utils.extend({}, _this.tree);
            return _this.createFlatGroupsList(_this.tree).filter(function (group) { return !!group.name; });
        })["catch"](console.error)["finally"](function () {
            _this.currentTask = null;
        });
        return this.currentTask;
    };
    ;
    return SecurityClearancesBuilder;
}(groupsBuilder_1["default"]));
exports["default"] = SecurityClearancesBuilder;
},{"./groupsBuilder":3,"./utils":8}],8:[function(require,module,exports){
"use strict";
exports.__esModule = true;
/// <reference path="../bluebird.d.ts"/>
var classNameCtrl = function (el) {
    var param = typeof el.className === "string" ? "className" : "baseVal";
    return {
        get: function () {
            return el[param] || "";
        },
        set: function (text) {
            el[param] = text;
        }
    };
}, isUsualObject = function (obj) {
    return Object.prototype.toString.call(obj).indexOf("Object") !== -1;
};
function removeClass(el, name) {
    if (!el) {
        return;
    }
    var classesStr = classNameCtrl(el).get(), classes = classesStr.split(" "), newClasses = classes.filter(function (classItem) { return classItem !== name; });
    classNameCtrl(el).set(newClasses.join(" "));
}
exports.removeClass = removeClass;
function addClass(el, name) {
    if (!el) {
        return;
    }
    var classesStr = classNameCtrl(el).get(), classes = classesStr.split(" ");
    if (classes.indexOf(name) === -1) {
        classNameCtrl(el).set(classesStr + " " + name);
    }
}
exports.addClass = addClass;
function hasClass(el, className) {
    return el && classNameCtrl(el).get().indexOf(className) !== -1;
}
exports.hasClass = hasClass;
function extend() {
    var args = [];
    for (var _i = 0; _i < arguments.length; _i++) {
        args[_i] = arguments[_i];
    }
    var length = args.length, src, srcKeys, srcAttr, fullCopy = false, resAttr, res = args[0], i = 1, j;
    if (typeof res === "boolean") {
        fullCopy = res;
        res = args[1];
        i++;
    }
    while (i !== length) {
        src = args[i];
        srcKeys = Object.keys(src);
        for (j = 0; j < srcKeys.length; j++) {
            srcAttr = src[srcKeys[j]];
            if (fullCopy && (isUsualObject(srcAttr) || Array.isArray(srcAttr))) {
                resAttr = res[srcKeys[j]];
                resAttr = res[srcKeys[j]] = (isUsualObject(resAttr) || Array.isArray(resAttr)) ? resAttr : (Array.isArray(srcAttr) ? [] : {});
                extend(fullCopy, resAttr, srcAttr);
            }
            else {
                res[srcKeys[j]] = src[srcKeys[j]];
            }
        }
        i++;
    }
    return res;
}
exports.extend = extend;
function entityToDictionary(entities, entityCallback) {
    var entity, o = {}, i, l = entities.length;
    for (i = 0; i < l; i++) {
        if (entities[i]) {
            entity = entities[i].id ? entities[i] : { id: entities[i] };
            o[entity.id] = entityCallback ? entityCallback(entity) : entity;
        }
    }
    return o;
}
exports.entityToDictionary = entityToDictionary;
function sortArrayOfEntities(entities, sortingFields) {
    var comparator = function (prevItem, nextItem, properties, index) {
        if (index === void 0) { index = 0; }
        if (properties.length <= index) {
            return 0;
        }
        var options = properties[index], _a = Array.isArray(options) ? options : [options], property = _a[0], _b = _a[1], dir = _b === void 0 ? "asc" : _b, dirMultiplier;
        dirMultiplier = dir === "asc" ? 1 : -1;
        if (prevItem[property] > nextItem[property]) {
            return 1 * dirMultiplier;
        }
        else if (prevItem[property] < nextItem[property]) {
            return -1 * dirMultiplier;
        }
        else {
            return comparator(prevItem, nextItem, properties, index + 1);
        }
    };
    return entities.sort(function (prevTemplate, nextTemplate) {
        return comparator(prevTemplate, nextTemplate, sortingFields);
    });
}
exports.sortArrayOfEntities = sortArrayOfEntities;
function downloadDataAsFile(data, filename, mimeType) {
    if (mimeType === void 0) { mimeType = "text/json"; }
    var blob = new Blob([data], { type: mimeType }), elem;
    if (window.navigator.msSaveOrOpenBlob) {
        window.navigator.msSaveBlob(blob, filename);
    }
    else {
        elem = window.document.createElement("a");
        elem.href = window.URL.createObjectURL(blob);
        elem.download = filename;
        document.body.appendChild(elem);
        elem.click();
        document.body.removeChild(elem);
    }
}
exports.downloadDataAsFile = downloadDataAsFile;
function mergeUniqueEntities() {
    var sources = [];
    for (var _i = 0; _i < arguments.length; _i++) {
        sources[_i] = arguments[_i];
    }
    var addedIds = [], mergedItems = [];
    sources.forEach(function (source) { return source.forEach(function (item) {
        if (item && item.id && addedIds.indexOf(item.id) === -1) {
            addedIds.push(item.id);
            mergedItems.push(item);
        }
    }); });
    return mergedItems;
}
exports.mergeUniqueEntities = mergeUniqueEntities;
function getEntitiesIds(entitiesList) {
    return Array.isArray(entitiesList) && entitiesList.reduce(function (result, entity) {
        entity && entity.id && result.push(entity.id);
        return result;
    }, []) || [];
}
exports.getEntitiesIds = getEntitiesIds;
function mergeUnique() {
    var sources = [];
    for (var _i = 0; _i < arguments.length; _i++) {
        sources[_i] = arguments[_i];
    }
    var mergedItems = [];
    sources.forEach(function (source) {
        Array.isArray(source) && source.forEach(function (item) {
            item && mergedItems.indexOf(item) === -1 && mergedItems.push(item);
        });
    });
    return mergedItems;
}
exports.mergeUnique = mergeUnique;
function getUniqueEntities(newEntities, existedEntities) {
    var selectedEntitiesHash = entityToDictionary(existedEntities);
    return newEntities.reduce(function (res, entity) {
        !selectedEntitiesHash[entity.id] && res.push(entity);
        return res;
    }, []);
}
exports.getUniqueEntities = getUniqueEntities;
function together(promises) {
    var results = [], resultsCount = 0;
    results.length = promises.length;
    return new Promise(function (resolve, reject) {
        var resolveAll = function () {
            return resolve(results);
        };
        promises.length ? promises.forEach(function (promise, index) {
            promise.then(function (result) {
                resultsCount++;
                results[index] = result;
                resultsCount === promises.length && resolveAll();
            })["catch"](function (error) {
                reject({
                    error: error,
                    promiseIndex: index
                });
            });
        }) : resolveAll();
    });
}
exports.together = together;
function resolvedPromise(val) {
    return new Promise(function (resolve) { return resolve(val); });
}
exports.resolvedPromise = resolvedPromise;
function toArray(data) {
    return Array.isArray(data) ? data : [data];
}
exports.toArray = toArray;
},{}],9:[function(require,module,exports){
"use strict";
exports.__esModule = true;
var Waiting = /** @class */ (function () {
    function Waiting() {
        this.bodyEl = document.body;
    }
    Waiting.prototype.start = function (el, zIndex) {
        if (el === void 0) { el = this.bodyEl; }
        if (el.offsetParent === null) {
            return false;
        }
        this.waitingContainer = document.createElement("div");
        this.waitingContainer.className = "waiting";
        this.waitingContainer.innerHTML = "<div class='fader'></div><div class='spinner'></div>";
        el.parentNode.appendChild(this.waitingContainer);
        this.waitingContainer.style.position = "absolute";
        this.waitingContainer.style.width = el.offsetWidth + "px";
        this.waitingContainer.style.height = el.offsetHeight + "px";
        this.waitingContainer.style.top = el.offsetTop + "px";
        this.waitingContainer.style.left = el.offsetLeft + "px";
        this.waitingContainer.style.display = "block";
        typeof zIndex === "number" && (this.waitingContainer.style.zIndex = zIndex.toString());
    };
    ;
    Waiting.prototype.stop = function () {
        if (this.waitingContainer && this.waitingContainer.parentNode) {
            this.waitingContainer.parentNode.removeChild(this.waitingContainer);
        }
    };
    ;
    return Waiting;
}());
exports["default"] = Waiting;
},{}]},{},[1])
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJzb3VyY2VzL2FkZGluLnRzIiwic291cmNlcy9kaXN0cmlidXRpb25MaXN0c0J1aWxkZXIudHMiLCJzb3VyY2VzL2dyb3Vwc0J1aWxkZXIudHMiLCJzb3VyY2VzL21pc2NCdWlsZGVyLnRzIiwic291cmNlcy9yZXBvcnRzQnVpbGRlci50cyIsInNvdXJjZXMvcnVsZXNCdWlsZGVyLnRzIiwic291cmNlcy9zZWN1cml0eUNsZWFyYW5jZXNCdWlsZGVyLnRzIiwic291cmNlcy91dGlscy50cyIsInNvdXJjZXMvd2FpdGluZy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O0FDQUEsaURBQTRDO0FBQzVDLHlFQUFvRTtBQUNwRSxtREFBOEM7QUFDOUMsK0NBQTBDO0FBQzFDLHVFQUFrRTtBQUNsRSw2Q0FBcUQ7QUFDckQsaUNBQW9KO0FBQ3BKLHFDQUFnQztBQTRDaEM7SUFvU0ksZUFBYSxHQUFHO1FBQWhCLGlCQVNDO1FBclNnQixjQUFTLEdBQWdCLFFBQVEsQ0FBQyxjQUFjLENBQUMsY0FBYyxDQUFDLENBQUM7UUFHakUsU0FBSSxHQUFnQjtZQUNqQyxNQUFNLEVBQUUsRUFBRTtZQUNWLE9BQU8sRUFBRSxFQUFFO1lBQ1gsS0FBSyxFQUFFLEVBQUU7WUFDVCxpQkFBaUIsRUFBRSxFQUFFO1lBQ3JCLE9BQU8sRUFBRSxFQUFFO1lBQ1gsS0FBSyxFQUFFLEVBQUU7WUFDVCxTQUFTLEVBQUUsRUFBRTtZQUNiLEtBQUssRUFBRSxFQUFFO1lBQ1QsU0FBUyxFQUFFLEVBQUU7WUFDYixZQUFZLEVBQUUsRUFBRTtZQUNoQixjQUFjLEVBQUUsRUFBRTtZQUNsQixVQUFVLEVBQUUsRUFBRTtZQUNkLFdBQVcsRUFBRSxFQUFFO1lBQ2YsSUFBSSxFQUFFLElBQUk7WUFDVixxQkFBcUIsRUFBRSxFQUFFO1NBQzVCLENBQUM7UUE0T2Usa0JBQWEsR0FBRyxVQUFDLE9BQWU7WUFBZix3QkFB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QyxHQUFHLEdBQUcsRUFBRSxDQUFDLFNBQVMsR0FBRyxJQUFJLENBQUM7UUFDdEQsSUFBSSxDQUFDLGdCQUFnQixDQUFDLEtBQUssQ0FBQyxJQUFJLEdBQUcsRUFBRSxDQUFDLFVBQVUsR0FBRyxJQUFJLENBQUM7UUFDeEQsSUFBSSxDQUFDLGdCQUFnQixDQUFDLEtBQUssQ0FBQyxPQUFPLEdBQUcsT0FBTyxDQUFDO1FBQzlDLE9BQU8sTUFBTSxLQUFLLFFBQVEsSUFBSSxDQUFDLElBQUksQ0FBQyxnQkFBZ0IsQ0FBQyxLQUFLLENBQUMsTUFBTSxHQUFHLE1BQU0sQ0FBQyxRQUFRLEVBQUUsQ0FBQyxDQUFDO0lBQzNGLENBQUM7SUFBQSxDQUFDO0lBRUssc0JBQUksR0FBWDtRQUNJLElBQUksSUFBSSxDQUFDLGdCQUFnQixJQUFJLElBQUksQ0FBQyxnQkFBZ0IsQ0FBQyxVQUFVLEVBQUU7WUFDM0QsSUFBSSxDQUFDLGdCQUFnQixDQUFDLFVBQVUsQ0FBQyxXQUFXLENBQUMsSUFBSSxDQUFDLGdCQUFnQixDQUFDLENBQUM7U0FDdkU7SUFDTCxDQUFDO0lBQUEsQ0FBQztJQUNOLGNBQUM7QUFBRCxDQTVCQSxBQTRCQyxJQUFBIiwiZmlsZSI6ImdlbmVyYXRlZC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzQ29udGVudCI6WyIoZnVuY3Rpb24oKXtmdW5jdGlvbiByKGUsbix0KXtmdW5jdGlvbiBvKGksZil7aWYoIW5baV0pe2lmKCFlW2ldKXt2YXIgYz1cImZ1bmN0aW9uXCI9PXR5cGVvZiByZXF1aXJlJiZyZXF1aXJlO2lmKCFmJiZjKXJldHVybiBjKGksITApO2lmKHUpcmV0dXJuIHUoaSwhMCk7dmFyIGE9bmV3IEVycm9yKFwiQ2Fubm90IGZpbmQgbW9kdWxlICdcIitpK1wiJ1wiKTt0aHJvdyBhLmNvZGU9XCJNT0RVTEVfTk9UX0ZPVU5EXCIsYX12YXIgcD1uW2ldPXtleHBvcnRzOnt9fTtlW2ldWzBdLmNhbGwocC5leHBvcnRzLGZ1bmN0aW9uKHIpe3ZhciBuPWVbaV1bMV1bcl07cmV0dXJuIG8obnx8cil9LHAscC5leHBvcnRzLHIsZSxuLHQpfXJldHVybiBuW2ldLmV4cG9ydHN9Zm9yKHZhciB1PVwiZnVuY3Rpb25cIj09dHlwZW9mIHJlcXVpcmUmJnJlcXVpcmUsaT0wO2k8dC5sZW5ndGg7aSsrKW8odFtpXSk7cmV0dXJuIG99cmV0dXJuIHJ9KSgpIiwiaW1wb3J0IEdyb3Vwc0J1aWxkZXIgZnJvbSBcIi4vZ3JvdXBzQnVpbGRlclwiO1xyXG5pbXBvcnQgU2VjdXJpdHlDbGVhcmFuY2VzQnVpbGRlciBmcm9tIFwiLi9zZWN1cml0eUNsZWFyYW5jZXNCdWlsZGVyXCI7XHJcbmltcG9ydCBSZXBvcnRzQnVpbGRlciBmcm9tIFwiLi9yZXBvcnRzQnVpbGRlclwiO1xyXG5pbXBvcnQgUnVsZXNCdWlsZGVyIGZyb20gXCIuL3J1bGVzQnVpbGRlclwiO1xyXG5pbXBvcnQgRGlzdHJpYnV0aW9uTGlzdHNCdWlsZGVyIGZyb20gXCIuL2Rpc3RyaWJ1dGlvbkxpc3RzQnVpbGRlclwiO1xyXG5pbXBvcnQge0lNaXNjRGF0YSwgTWlzY0J1aWxkZXJ9IGZyb20gXCIuL21pc2NCdWlsZGVyXCI7XHJcbmltcG9ydCB7ZG93bmxvYWREYXRhQXNGaWxlLCBtZXJnZVVuaXF1ZSwgSUVudGl0eSwgbWVyZ2VVbmlxdWVFbnRpdGllcywgZ2V0VW5pcXVlRW50aXRpZXMsIGdldEVudGl0aWVzSWRzLCB0b2dldGhlciwgcmVzb2x2ZWRQcm9taXNlfSBmcm9tIFwiLi91dGlsc1wiO1xyXG5pbXBvcnQgV2FpdGluZyBmcm9tIFwiLi93YWl0aW5nXCI7XHJcblxyXG5pbnRlcmZhY2UgR2VvdGFiIHtcclxuICAgIGFkZGluOiB7XHJcbiAgICAgICAgcmVnaXN0cmF0aW9uQ29uZmlnOiBGdW5jdGlvblxyXG4gICAgfTtcclxufVxyXG5cclxuaW50ZXJmYWNlIElJbXBvcnREYXRhIHtcclxuICAgIGdyb3VwczogYW55W107XHJcbiAgICByZXBvcnRzOiBhbnlbXTtcclxuICAgIHJ1bGVzOiBhbnlbXTtcclxuICAgIGRpc3RyaWJ1dGlvbkxpc3RzOiBhbnlbXTtcclxuICAgIGRldmljZXM6IGFueVtdO1xyXG4gICAgdXNlcnM6IGFueVtdO1xyXG4gICAgem9uZVR5cGVzOiBhbnlbXTtcclxuICAgIHpvbmVzOiBhbnlbXTtcclxuICAgIHdvcmtUaW1lczogYW55W107XHJcbiAgICB3b3JrSG9saWRheXM6IGFueVtdO1xyXG4gICAgc2VjdXJpdHlHcm91cHM6IGFueVtdO1xyXG4gICAgZGlhZ25vc3RpY3M6IGFueVtdO1xyXG4gICAgY3VzdG9tTWFwczogYW55W107XHJcbiAgICBtaXNjOiBJTWlzY0RhdGE7XHJcbiAgICBub3RpZmljYXRpb25UZW1wbGF0ZXM6IGFueVtdO1xyXG59XHJcbmludGVyZmFjZSBJRGVwZW5kZW5jaWVzIHtcclxuICAgIGdyb3Vwcz86IHN0cmluZ1tdO1xyXG4gICAgcmVwb3J0cz86IHN0cmluZ1tdO1xyXG4gICAgcnVsZXM/OiBzdHJpbmdbXTtcclxuICAgIGRpc3RyaWJ1dGlvbkxpc3RzPzogc3RyaW5nW107XHJcbiAgICBkZXZpY2VzPzogc3RyaW5nW107XHJcbiAgICB1c2Vycz86IHN0cmluZ1tdO1xyXG4gICAgem9uZVR5cGVzPzogc3RyaW5nW107XHJcbiAgICB6b25lcz86IHN0cmluZ1tdO1xyXG4gICAgd29ya1RpbWVzPzogc3RyaW5nW107XHJcbiAgICB3b3JrSG9saWRheXM/OiBzdHJpbmdbXTtcclxuICAgIHNlY3VyaXR5R3JvdXBzPzogc3RyaW5nW107XHJcbiAgICBkaWFnbm9zdGljcz86IHN0cmluZ1tdO1xyXG4gICAgY3VzdG9tTWFwcz86IHN0cmluZ1tdO1xyXG4gICAgbm90aWZpY2F0aW9uVGVtcGxhdGVzPzogc3RyaW5nW107XHJcbn1cclxuXHJcbmRlY2xhcmUgY29uc3QgZ2VvdGFiOiBHZW90YWI7XHJcblxyXG5jbGFzcyBBZGRpbiB7XHJcbiAgICBwcml2YXRlIHJlYWRvbmx5IGFwaTtcclxuICAgIHByaXZhdGUgcmVhZG9ubHkgZ3JvdXBzQnVpbGRlcjogR3JvdXBzQnVpbGRlcjtcclxuICAgIHByaXZhdGUgcmVhZG9ubHkgc2VjdXJpdHlDbGVhcmFuY2VzQnVpbGRlcjogU2VjdXJpdHlDbGVhcmFuY2VzQnVpbGRlcjtcclxuICAgIHByaXZhdGUgcmVhZG9ubHkgcmVwb3J0c0J1aWxkZXI6IFJlcG9ydHNCdWlsZGVyO1xyXG4gICAgcHJpdmF0ZSByZWFkb25seSBydWxlc0J1aWxkZXI6IFJ1bGVzQnVpbGRlcjtcclxuICAgIHByaXZhdGUgcmVhZG9ubHkgZGlzdHJpYnV0aW9uTGlzdHNCdWlsZGVyOiBEaXN0cmlidXRpb25MaXN0c0J1aWxkZXI7XHJcbiAgICBwcml2YXRlIHJlYWRvbmx5IG1pc2NCdWlsZGVyOiBNaXNjQnVpbGRlcjtcclxuICAgIHByaXZhdGUgcmVhZG9ubHkgZXhwb3J0QnRuOiBIVE1MRWxlbWVudCA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwiZXhwb3J0QnV0dG9uXCIpO1xyXG4gICAgcHJpdmF0ZSByZWFkb25seSB3YWl0aW5nOiBXYWl0aW5nO1xyXG4gICAgcHJpdmF0ZSBjdXJyZW50VGFzaztcclxuICAgIHByaXZhdGUgcmVhZG9ubHkgZGF0YTogSUltcG9ydERhdGEgPSB7XHJcbiAgICAgICAgZ3JvdXBzOiBbXSxcclxuICAgICAgICByZXBvcnRzOiBbXSxcclxuICAgICAgICBydWxlczogW10sXHJcbiAgICAgICAgZGlzdHJpYnV0aW9uTGlzdHM6IFtdLFxyXG4gICAgICAgIGRldmljZXM6IFtdLFxyXG4gICAgICAgIHVzZXJzOiBbXSxcclxuICAgICAgICB6b25lVHlwZXM6IFtdLFxyXG4gICAgICAgIHpvbmVzOiBbXSxcclxuICAgICAgICB3b3JrVGltZXM6IFtdLFxyXG4gICAgICAgIHdvcmtIb2xpZGF5czogW10sXHJcbiAgICAgICAgc2VjdXJpdHlHcm91cHM6IFtdLFxyXG4gICAgICAgIGN1c3RvbU1hcHM6IFtdLFxyXG4gICAgICAgIGRpYWdub3N0aWNzOiBbXSxcclxuICAgICAgICBtaXNjOiBudWxsLFxyXG4gICAgICAgIG5vdGlmaWNhdGlvblRlbXBsYXRlczogW11cclxuICAgIH07XHJcblxyXG4gICAgcHJpdmF0ZSBjb21iaW5lRGVwZW5kZW5jaWVzICguLi5hbGxEZXBlbmRlbmNpZXM6IElEZXBlbmRlbmNpZXNbXSk6IElEZXBlbmRlbmNpZXMge1xyXG4gICAgICAgIGxldCB0b3RhbCA9IHtcclxuICAgICAgICAgICAgZ3JvdXBzOiBbXSxcclxuICAgICAgICAgICAgcmVwb3J0czogW10sXHJcbiAgICAgICAgICAgIHJ1bGVzOiBbXSxcclxuICAgICAgICAgICAgZGV2aWNlczogW10sXHJcbiAgICAgICAgICAgIHVzZXJzOiBbXSxcclxuICAgICAgICAgICAgem9uZVR5cGVzOiBbXSxcclxuICAgICAgICAgICAgem9uZXM6IFtdLFxyXG4gICAgICAgICAgICB3b3JrVGltZXM6IFtdLFxyXG4gICAgICAgICAgICB3b3JrSG9saWRheXM6IFtdLFxyXG4gICAgICAgICAgICBzZWN1cml0eUdyb3VwczogW10sXHJcbiAgICAgICAgICAgIGRpYWdub3N0aWNzOiBbXSxcclxuICAgICAgICAgICAgY3VzdG9tTWFwczogW10sXHJcbiAgICAgICAgICAgIG5vdGlmaWNhdGlvblRlbXBsYXRlczogW11cclxuICAgICAgICB9O1xyXG4gICAgICAgIHJldHVybiBPYmplY3Qua2V5cyh0b3RhbCkucmVkdWNlKChkZXBlbmRlbmNpZXMsIGRlcGVuZGVuY3lOYW1lOiBzdHJpbmcpID0+IHtcclxuICAgICAgICAgICAgZGVwZW5kZW5jaWVzW2RlcGVuZGVuY3lOYW1lXSA9IG1lcmdlVW5pcXVlKGRlcGVuZGVuY2llc1tkZXBlbmRlbmN5TmFtZV0sIC4uLmFsbERlcGVuZGVuY2llcy5tYXAoKGVudGl0eURlcGVuZGVuY2llcykgPT4gZW50aXR5RGVwZW5kZW5jaWVzW2RlcGVuZGVuY3lOYW1lXSkpO1xyXG4gICAgICAgICAgICByZXR1cm4gZGVwZW5kZW5jaWVzO1xyXG4gICAgICAgIH0sIHRvdGFsKTtcclxuICAgIH1cclxuXHJcbiAgICBwcml2YXRlIGFkZE5ld0dyb3VwcyAoZ3JvdXBzOiBzdHJpbmdbXSwgZGF0YTogSUltcG9ydERhdGEpOiBQcm9taXNlPGFueT4ge1xyXG4gICAgICAgIGlmICghZ3JvdXBzIHx8ICFncm91cHMubGVuZ3RoKSB7XHJcbiAgICAgICAgICAgIHJldHVybiByZXNvbHZlZFByb21pc2UoKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgbGV0IGdyb3Vwc0RhdGEgPSB0aGlzLmdyb3Vwc0J1aWxkZXIuZ2V0R3JvdXBzRGF0YShncm91cHMsIHRydWUpLFxyXG4gICAgICAgICAgICBuZXdHcm91cHNVc2VycyA9IGdldFVuaXF1ZUVudGl0aWVzKHRoaXMuZ3JvdXBzQnVpbGRlci5nZXRQcml2YXRlR3JvdXBzVXNlcnMoZ3JvdXBzRGF0YSksIGRhdGEudXNlcnMpO1xyXG4gICAgICAgIGRhdGEuZ3JvdXBzID0gbWVyZ2VVbmlxdWVFbnRpdGllcyhkYXRhLmdyb3VwcywgZ3JvdXBzRGF0YSk7XHJcbiAgICAgICAgZGF0YS51c2VycyA9IG1lcmdlVW5pcXVlRW50aXRpZXMoZGF0YS51c2VycywgbmV3R3JvdXBzVXNlcnMpO1xyXG4gICAgICAgIHJldHVybiB0aGlzLnJlc29sdmVEZXBlbmRlbmNpZXMoe3VzZXJzOiBnZXRFbnRpdGllc0lkcyhuZXdHcm91cHNVc2Vycyl9LCBkYXRhKTtcclxuICAgIH1cclxuXHJcbiAgICBwcml2YXRlIGFkZE5ld0N1c3RvbU1hcHMgKGN1c3RvbU1hcHNJZHM6IHN0cmluZ1tdLCBkYXRhOiBJSW1wb3J0RGF0YSkge1xyXG4gICAgICAgIGlmICghY3VzdG9tTWFwc0lkcyB8fCAhY3VzdG9tTWFwc0lkcy5sZW5ndGgpIHtcclxuICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xyXG4gICAgICAgIH1cclxuICAgICAgICBsZXQgY3VzdG9tTWFwc0RhdGEgPSBjdXN0b21NYXBzSWRzLnJlZHVjZSgoZGF0YSwgY3VzdG9tTWFwSWQ6IHN0cmluZykgPT4ge1xyXG4gICAgICAgICAgICBsZXQgY3VzdG9tTWFwRGF0YSA9IHRoaXMubWlzY0J1aWxkZXIuZ2V0TWFwUHJvdmlkZXJEYXRhKGN1c3RvbU1hcElkKTtcclxuICAgICAgICAgICAgY3VzdG9tTWFwRGF0YSAmJiBkYXRhLnB1c2goY3VzdG9tTWFwRGF0YSk7XHJcbiAgICAgICAgICAgIHJldHVybiBkYXRhO1xyXG4gICAgICAgIH0sIFtdKTtcclxuICAgICAgICBkYXRhLmN1c3RvbU1hcHMgPSBtZXJnZVVuaXF1ZUVudGl0aWVzKGRhdGEuY3VzdG9tTWFwcywgY3VzdG9tTWFwc0RhdGEpO1xyXG4gICAgfVxyXG5cclxuICAgIHByaXZhdGUgYWRkTmV3Tm90aWZpY2F0aW9uVGVtcGxhdGVzIChub3RpZmljYXRpb25UZW1wbGF0ZXNJZHM6IHN0cmluZ1tdLCBkYXRhOiBJSW1wb3J0RGF0YSkge1xyXG4gICAgICAgIGlmICghbm90aWZpY2F0aW9uVGVtcGxhdGVzSWRzIHx8ICFub3RpZmljYXRpb25UZW1wbGF0ZXNJZHMubGVuZ3RoKSB7XHJcbiAgICAgICAgICAgIHJldHVybiBmYWxzZTtcclxuICAgICAgICB9XHJcbiAgICAgICAgbGV0IG5vdGlmaWNhdGlvblRlbXBsYXRlc0RhdGEgPSBub3RpZmljYXRpb25UZW1wbGF0ZXNJZHMucmVkdWNlKChkYXRhLCB0ZW1wbGF0ZUlkOiBzdHJpbmcpID0+IHtcclxuICAgICAgICAgICAgbGV0IHRlbXBsYXRlRGF0YSA9IHRoaXMuZGlzdHJpYnV0aW9uTGlzdHNCdWlsZGVyLmdldE5vdGlmaWNhdGlvblRlbXBsYXRlRGF0YSh0ZW1wbGF0ZUlkKTtcclxuICAgICAgICAgICAgdGVtcGxhdGVEYXRhICYmIGRhdGEucHVzaCh0ZW1wbGF0ZURhdGEpO1xyXG4gICAgICAgICAgICByZXR1cm4gZGF0YTtcclxuICAgICAgICB9LCBbXSk7XHJcbiAgICAgICAgZGF0YS5ub3RpZmljYXRpb25UZW1wbGF0ZXMgPSBtZXJnZVVuaXF1ZUVudGl0aWVzKGRhdGEubm90aWZpY2F0aW9uVGVtcGxhdGVzLCBub3RpZmljYXRpb25UZW1wbGF0ZXNEYXRhKTtcclxuICAgIH1cclxuXHJcbiAgICBwcml2YXRlIGdldEVudHl0aWVzSWRzIChlbnRpdGllczogSUVudGl0eVtdKTogc3RyaW5nW10ge1xyXG4gICAgICAgIHJldHVybiBlbnRpdGllcy5yZWR1Y2UoKHJlcywgZW50aXR5KSA9PiB7XHJcbiAgICAgICAgICAgIGVudGl0eSAmJiBlbnRpdHkuaWQgJiYgcmVzLnB1c2goZW50aXR5LmlkKTtcclxuICAgICAgICAgICAgcmV0dXJuIHJlcztcclxuICAgICAgICB9LCBbXSk7XHJcbiAgICB9XHJcblxyXG4gICAgcHJpdmF0ZSBnZXRFbnRpdHlEZXBlbmRlbmNpZXMgKGVudGl0eTogSUVudGl0eSwgZW50aXR5VHlwZSkge1xyXG4gICAgICAgIGxldCBlbnRpdHlEZXBlbmRlbmNpZXM6IElEZXBlbmRlbmNpZXMgPSB7fTtcclxuICAgICAgICBzd2l0Y2ggKGVudGl0eVR5cGUpIHtcclxuICAgICAgICAgICAgY2FzZSBcImRldmljZXNcIjpcclxuICAgICAgICAgICAgICAgIGVudGl0eURlcGVuZGVuY2llcy5ncm91cHMgPSB0aGlzLmdldEVudHl0aWVzSWRzKGVudGl0eVtcImdyb3Vwc1wiXS5jb25jYXQoZW50aXR5W1wiYXV0b0dyb3Vwc1wiXSkpO1xyXG4gICAgICAgICAgICAgICAgZW50aXR5W1wid29ya1RpbWVcIl0uaWQgJiYgKGVudGl0eURlcGVuZGVuY2llcy53b3JrVGltZXMgPSBbZW50aXR5W1wid29ya1RpbWVcIl0uaWRdKTtcclxuICAgICAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgICAgICBjYXNlIFwidXNlcnNcIjpcclxuICAgICAgICAgICAgICAgIGVudGl0eURlcGVuZGVuY2llcy5ncm91cHMgPSB0aGlzLmdldEVudHl0aWVzSWRzKGVudGl0eVtcImNvbXBhbnlHcm91cHNcIl0uY29uY2F0KGVudGl0eVtcImRyaXZlckdyb3Vwc1wiXSkuY29uY2F0KGVudGl0eVtcInByaXZhdGVVc2VyR3JvdXBzXCJdKS5jb25jYXQoZW50aXR5W1wicmVwb3J0R3JvdXBzXCJdKSk7XHJcbiAgICAgICAgICAgICAgICBlbnRpdHlEZXBlbmRlbmNpZXMuc2VjdXJpdHlHcm91cHMgPSB0aGlzLmdldEVudHl0aWVzSWRzKGVudGl0eVtcInNlY3VyaXR5R3JvdXBzXCJdKTtcclxuICAgICAgICAgICAgICAgIGVudGl0eURlcGVuZGVuY2llcy5jdXN0b21NYXBzID0gW2VudGl0eVtcImRlZmF1bHRNYXBFbmdpbmVcIl1dO1xyXG4gICAgICAgICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgICAgIGNhc2UgXCJ6b25lc1wiOlxyXG4gICAgICAgICAgICAgICAgbGV0IHpvbmVUeXBlcyA9IHRoaXMuZ2V0RW50eXRpZXNJZHMoZW50aXR5W1wiem9uZVR5cGVzXCJdKTtcclxuICAgICAgICAgICAgICAgIHpvbmVUeXBlcy5sZW5ndGggJiYgKGVudGl0eURlcGVuZGVuY2llcy56b25lVHlwZXMgPSB6b25lVHlwZXMpO1xyXG4gICAgICAgICAgICAgICAgZW50aXR5RGVwZW5kZW5jaWVzLmdyb3VwcyA9IHRoaXMuZ2V0RW50eXRpZXNJZHMoZW50aXR5W1wiZ3JvdXBzXCJdKTtcclxuICAgICAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgICAgICBjYXNlIFwid29ya1RpbWVzXCI6XHJcbiAgICAgICAgICAgICAgICBlbnRpdHlbXCJob2xpZGF5R3JvdXBcIl0uZ3JvdXBJZCAmJiAoZW50aXR5RGVwZW5kZW5jaWVzLndvcmtIb2xpZGF5cyA9IFtlbnRpdHlbXCJob2xpZGF5R3JvdXBcIl0uZ3JvdXBJZF0pO1xyXG4gICAgICAgICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgICAgIGRlZmF1bHQ6XHJcbiAgICAgICAgICAgICAgICBicmVhaztcclxuICAgICAgICB9XHJcbiAgICAgICAgcmV0dXJuIGVudGl0eURlcGVuZGVuY2llcztcclxuICAgIH1cclxuXHJcbiAgICBwcml2YXRlIGFwcGx5VG9FbnRpdGllcyAoZW50aXRpZXNMaXN0OiBJRGVwZW5kZW5jaWVzLCBpbml0aWFsVmFsdWUsIGZ1bmM6IChyZXN1bHQsIGVudGl0eSwgZW50aXR5VHlwZTogc3RyaW5nLCBlbnRpdHlJbmRleDogbnVtYmVyLCBlbnRpdHlUeXBlSW5kZXg6IG51bWJlciwgb3ZlcmFsbEluZGV4OiBudW1iZXIpID0+IGFueSkge1xyXG4gICAgICAgIGxldCBvdmVyYWxsSW5kZXggPSAwO1xyXG4gICAgICAgIHJldHVybiBPYmplY3Qua2V5cyhlbnRpdGllc0xpc3QpLnJlZHVjZSgocmVzdWx0LCBlbnRpdHlUeXBlLCB0eXBlSW5kZXgpID0+IHtcclxuICAgICAgICAgICAgcmV0dXJuIGVudGl0aWVzTGlzdFtlbnRpdHlUeXBlXS5yZWR1Y2UoKHJlcywgZW50aXR5LCBpbmRleCkgPT4ge1xyXG4gICAgICAgICAgICAgICAgb3ZlcmFsbEluZGV4Kys7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gZnVuYyhyZXMsIGVudGl0eSwgZW50aXR5VHlwZSwgaW5kZXgsIHR5cGVJbmRleCwgb3ZlcmFsbEluZGV4IC0gMSk7XHJcbiAgICAgICAgICAgIH0sIHJlc3VsdCk7XHJcbiAgICAgICAgfSwgaW5pdGlhbFZhbHVlKTtcclxuICAgIH1cclxuXHJcbiAgICBwcml2YXRlIHJlc29sdmVEZXBlbmRlbmNpZXMgKGRlcGVuZGVuY2llczogSURlcGVuZGVuY2llcywgZGF0YTogSUltcG9ydERhdGEpIHtcclxuICAgICAgICBsZXQgZ2V0RGF0YSA9IChlbnRpdGllc0xpc3Q6IElEZXBlbmRlbmNpZXMpOiBQcm9taXNlPElJbXBvcnREYXRhPiA9PiB7XHJcbiAgICAgICAgICAgICAgICBsZXQgZW50aXR5UmVxdWVzdFR5cGVzID0ge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBkZXZpY2VzOiBcIkRldmljZVwiLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICB1c2VyczogXCJVc2VyXCIsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHpvbmVUeXBlczogXCJab25lVHlwZVwiLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICB6b25lczogXCJab25lXCIsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHdvcmtUaW1lczogXCJXb3JrVGltZVwiLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICB3b3JrSG9saWRheXM6IFwiV29ya0hvbGlkYXlcIixcclxuICAgICAgICAgICAgICAgICAgICAgICAgc2VjdXJpdHlHcm91cHM6IFwiR3JvdXBcIixcclxuICAgICAgICAgICAgICAgICAgICAgICAgZGlhZ25vc3RpY3M6IFwiRGlhZ25vc3RpY1wiLFxyXG4gICAgICAgICAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgICAgICAgICAgcmVxdWVzdHM6IGFueSA9IHRoaXMuYXBwbHlUb0VudGl0aWVzKGVudGl0aWVzTGlzdCwge30sIChyZXN1bHQsIGVudGl0eUlkLCBlbnRpdHlUeXBlKSA9PiB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGxldCByZXF1ZXN0ID0ge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdHlwZU5hbWU6IGVudGl0eVJlcXVlc3RUeXBlc1tlbnRpdHlUeXBlXSxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHNlYXJjaDoge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlkOiBlbnRpdHlJZFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgICAgICB9O1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoZW50aXR5UmVxdWVzdFR5cGVzW2VudGl0eVR5cGVdKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoZW50aXR5VHlwZSA9PT0gXCJ3b3JrSG9saWRheXNcIiB8fCBlbnRpdHlUeXBlID09PSBcInNlY3VyaXR5R3JvdXBzXCIpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gcmVzdWx0O1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgIXJlc3VsdFtlbnRpdHlUeXBlXSAmJiAocmVzdWx0W2VudGl0eVR5cGVdID0gW10pO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcmVzdWx0W2VudGl0eVR5cGVdLnB1c2goW1wiR2V0XCIsIHJlcXVlc3RdKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gcmVzdWx0O1xyXG4gICAgICAgICAgICAgICAgICAgIH0pO1xyXG5cclxuICAgICAgICAgICAgICAgIGlmIChlbnRpdGllc0xpc3Quc2VjdXJpdHlHcm91cHMgJiYgZW50aXRpZXNMaXN0LnNlY3VyaXR5R3JvdXBzLmxlbmd0aCkge1xyXG4gICAgICAgICAgICAgICAgICAgIHJlcXVlc3RzLnNlY3VyaXR5R3JvdXBzID0gW1tcIkdldFwiLCB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHR5cGVOYW1lOiBlbnRpdHlSZXF1ZXN0VHlwZXMuc2VjdXJpdHlHcm91cHMsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHNlYXJjaDoge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaWQ6IFwiR3JvdXBTZWN1cml0eUlkXCJcclxuICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgIH1dXTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIGlmIChlbnRpdGllc0xpc3Qud29ya0hvbGlkYXlzICYmIGVudGl0aWVzTGlzdC53b3JrSG9saWRheXMubGVuZ3RoKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgcmVxdWVzdHMud29ya0hvbGlkYXlzID0gW1tcIkdldFwiLCB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHR5cGVOYW1lOiBlbnRpdHlSZXF1ZXN0VHlwZXMud29ya0hvbGlkYXlzXHJcbiAgICAgICAgICAgICAgICAgICAgfV1dO1xyXG4gICAgICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgICAgIHJldHVybiB0aGlzLmFkZE5ld0dyb3VwcyhlbnRpdGllc0xpc3QuZ3JvdXBzLCBkYXRhKS50aGVuKCgpID0+IHtcclxuICAgICAgICAgICAgICAgICAgICB0aGlzLmFkZE5ld0N1c3RvbU1hcHMoZW50aXRpZXNMaXN0LmN1c3RvbU1hcHMsIGRhdGEpO1xyXG4gICAgICAgICAgICAgICAgICAgIHRoaXMuYWRkTmV3Tm90aWZpY2F0aW9uVGVtcGxhdGVzKGVudGl0aWVzTGlzdC5ub3RpZmljYXRpb25UZW1wbGF0ZXMsIGRhdGEpO1xyXG4gICAgICAgICAgICAgICAgICAgIGRlbGV0ZSBlbnRpdGllc0xpc3QuZ3JvdXBzO1xyXG4gICAgICAgICAgICAgICAgICAgIGRlbGV0ZSBlbnRpdGllc0xpc3QuY3VzdG9tTWFwcztcclxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gbmV3IFByb21pc2U8SUltcG9ydERhdGE+KChyZXNvbHZlLCByZWplY3QpID0+IHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgbGV0IHJlcXVlc3RFbnRpdGllcyA9IE9iamVjdC5rZXlzKHJlcXVlc3RzKSxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJlcXVlc3RzQXJyYXkgPSByZXF1ZXN0RW50aXRpZXMucmVkdWNlKChsaXN0LCB0eXBlKSA9PiBsaXN0LmNvbmNhdChyZXF1ZXN0c1t0eXBlXSksIFtdKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKCFyZXF1ZXN0RW50aXRpZXMubGVuZ3RoKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gcmVzb2x2ZShkYXRhKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLmFwaS5tdWx0aUNhbGwocmVxdWVzdHNBcnJheSwgKHJlc3BvbnNlKSA9PiB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgbGV0IG5ld0dyb3VwcyA9IFtdLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBuZXdDdXN0b21NYXBzID0gW10sXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIG5ld0RlcGVuZGVuY2llczogSURlcGVuZGVuY2llcyA9IHt9LFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBleHBvcnRlZERhdGE6IGFueSA9IHRoaXMuYXBwbHlUb0VudGl0aWVzKHJlcXVlc3RzLCB7fSwgKHJlc3VsdCwgcmVxdWVzdCwgZW50aXR5VHlwZSwgZW50aXR5SW5kZXgsIGVudGl0eVR5cGVJbmRleCwgb3ZlcmFsbEluZGV4KSA9PiB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBsZXQgaXRlbXMgPSByZXF1ZXN0c0FycmF5Lmxlbmd0aCA+IDEgPyByZXNwb25zZVtvdmVyYWxsSW5kZXhdIDogcmVzcG9uc2U7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpdGVtcy5mb3JFYWNoKChpdGVtKSA9PiB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaXRlbSA9IGl0ZW1bMF0gfHwgaXRlbTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAhcmVzdWx0W2VudGl0eVR5cGVdICYmIChyZXN1bHRbZW50aXR5VHlwZV0gPSBbXSk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGVudGl0eVR5cGUgPT09IFwid29ya0hvbGlkYXlzXCIgJiYgKCFpdGVtLmhvbGlkYXlHcm91cCB8fCBlbnRpdGllc0xpc3Qud29ya0hvbGlkYXlzLmluZGV4T2YoaXRlbS5ob2xpZGF5R3JvdXAuZ3JvdXBJZCkgPT09IC0xKSkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gZmFsc2U7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfSBlbHNlIGlmIChlbnRpdHlUeXBlID09PSBcInNlY3VyaXR5R3JvdXBzXCIpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGVudGl0aWVzTGlzdC5zZWN1cml0eUdyb3Vwcy5pbmRleE9mKGl0ZW0uaWQpID4gLTEpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJlc3VsdFtlbnRpdHlUeXBlXSA9IHJlc3VsdFtlbnRpdHlUeXBlXS5jb25jYXQodGhpcy5ncm91cHNCdWlsZGVyLmdldEN1c3RvbUdyb3Vwc0RhdGEoZW50aXRpZXNMaXN0LnNlY3VyaXR5R3JvdXBzLCBpdGVtcykpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHJlc3VsdDtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gZmFsc2U7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfSBlbHNlIGlmIChlbnRpdHlUeXBlID09PSBcInVzZXJzXCIpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaXRlbS51c2VyQXV0aGVudGljYXRpb25UeXBlID0gXCJCYXNpY0F1dGhlbnRpY2F0aW9uXCI7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGxldCBlbnRpdHlEZXBlbmRlbmNpZXMgPSB0aGlzLmdldEVudGl0eURlcGVuZGVuY2llcyhpdGVtLCBlbnRpdHlUeXBlKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBuZXdEZXBlbmRlbmNpZXMgPSB0aGlzLmFwcGx5VG9FbnRpdGllcyhlbnRpdHlEZXBlbmRlbmNpZXMsIG5ld0RlcGVuZGVuY2llcywgKHJlc3VsdCwgZW50aXR5SWQsIGVudGl0eVR5cGUpID0+IHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIXJlc3VsdFtlbnRpdHlUeXBlXSAmJiAocmVzdWx0W2VudGl0eVR5cGVdID0gW10pO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXN1bHRbZW50aXR5VHlwZV0gPSBtZXJnZVVuaXF1ZShyZXN1bHRbZW50aXR5VHlwZV0sIFtlbnRpdHlJZF0pO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gcmVzdWx0O1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIG5ld0dyb3VwcyA9IG5ld0dyb3Vwcy5jb25jYXQobmV3RGVwZW5kZW5jaWVzLmdyb3VwcyB8fCBbXSk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgbmV3Q3VzdG9tTWFwcyA9IG5ld0N1c3RvbU1hcHMuY29uY2F0KG5ld0RlcGVuZGVuY2llcy5jdXN0b21NYXBzIHx8IFtdKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBkZWxldGUgbmV3RGVwZW5kZW5jaWVzLmdyb3VwcztcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBkZWxldGUgbmV3RGVwZW5kZW5jaWVzLmN1c3RvbU1hcHM7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcmVzdWx0W2VudGl0eVR5cGVdLnB1c2goaXRlbSk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiByZXN1bHQ7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIG5ld0RlcGVuZGVuY2llcyA9IE9iamVjdC5rZXlzKG5ld0RlcGVuZGVuY2llcykucmVkdWNlKChyZXN1bHQsIGRlcGVuZGVuY3lOYW1lKSA9PiB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGxldCBlbnRpdGllcyA9IG5ld0RlcGVuZGVuY2llc1tkZXBlbmRlbmN5TmFtZV0sXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBleHBvcnRlZCA9IChleHBvcnRlZERhdGFbZGVwZW5kZW5jeU5hbWVdIHx8IFtdKS5tYXAoZW50aXR5ID0+IGVudGl0eS5pZCk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGVudGl0aWVzLmZvckVhY2goZW50aXR5SWQgPT4ge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGV4cG9ydGVkLmluZGV4T2YoZW50aXR5SWQpID09PSAtMSkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICFyZXN1bHRbZGVwZW5kZW5jeU5hbWVdICYmIChyZXN1bHRbZGVwZW5kZW5jeU5hbWVdID0gW10pO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJlc3VsdFtkZXBlbmRlbmN5TmFtZV0ucHVzaChlbnRpdHlJZCk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gcmVzdWx0O1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0sIHt9IGFzIElJbXBvcnREYXRhKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBSZW1vdmUgYnVpbHQtaW4gc2VjdXJpdHkgZ3JvdXBzXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZXhwb3J0ZWREYXRhLnNlY3VyaXR5R3JvdXBzICYmIChleHBvcnRlZERhdGEuc2VjdXJpdHlHcm91cHMgPSBleHBvcnRlZERhdGEuc2VjdXJpdHlHcm91cHMucmVkdWNlKChyZXN1bHQsIGdyb3VwKSA9PiB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGdyb3VwLmlkLmluZGV4T2YoXCJHcm91cFwiKSA9PT0gLTEgJiYgcmVzdWx0LnB1c2goZ3JvdXApO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gcmVzdWx0O1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0sIFtdKSk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5hZGROZXdHcm91cHMobmV3R3JvdXBzLCBkYXRhKS50aGVuKCgpID0+IHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5hZGROZXdDdXN0b21NYXBzKG5ld0N1c3RvbU1hcHMsIGRhdGEpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBPYmplY3Qua2V5cyhleHBvcnRlZERhdGEpLmZvckVhY2goKGVudGl0eVR5cGU6IHN0cmluZykgPT4ge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZGF0YVtlbnRpdHlUeXBlXSA9IG1lcmdlVW5pcXVlRW50aXRpZXMoZGF0YVtlbnRpdHlUeXBlXSwgZXhwb3J0ZWREYXRhW2VudGl0eVR5cGVdKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChPYmplY3Qua2V5cyhuZXdEZXBlbmRlbmNpZXMpLmxlbmd0aCkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcmVzb2x2ZSh0aGlzLnJlc29sdmVEZXBlbmRlbmNpZXMobmV3RGVwZW5kZW5jaWVzLCBkYXRhKSk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXNvbHZlKGRhdGEpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfSwgcmVqZWN0KTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0sIHJlamVjdCk7XHJcbiAgICAgICAgICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgfTtcclxuICAgICAgICByZXR1cm4gbmV3IFByb21pc2U8SUltcG9ydERhdGE+KChyZXNvbHZlLCByZWplY3QpID0+IHtcclxuICAgICAgICAgICAgcmV0dXJuIGdldERhdGEoZGVwZW5kZW5jaWVzKS50aGVuKHJlc29sdmUpLmNhdGNoKHJlamVjdCk7XHJcbiAgICAgICAgfSk7XHJcbiAgICB9XHJcblxyXG4gICAgcHJpdmF0ZSBhYm9ydEN1cnJlbnRUYXNrICgpIHtcclxuICAgICAgICB0aGlzLnRvZ2dsZVdhaXRpbmcoKTtcclxuICAgICAgICB0aGlzLmN1cnJlbnRUYXNrICYmIHRoaXMuY3VycmVudFRhc2suYWJvcnQgJiYgdGhpcy5jdXJyZW50VGFzay5hYm9ydCgpO1xyXG4gICAgICAgIHRoaXMuY3VycmVudFRhc2sgPSBudWxsO1xyXG4gICAgfVxyXG5cclxuICAgIHByaXZhdGUgdG9nZ2xlRXhwb3J0QnV0dG9uIChpc0Rpc2FibGVkOiBib29sZWFuKSB7XHJcbiAgICAgICAgKDxIVE1MSW5wdXRFbGVtZW50PnRoaXMuZXhwb3J0QnRuKS5kaXNhYmxlZCA9IGlzRGlzYWJsZWQ7XHJcbiAgICB9XHJcblxyXG4gICAgcHJpdmF0ZSByZWFkb25seSB0b2dnbGVXYWl0aW5nID0gKGlzU3RhcnQgPSBmYWxzZSkgPT4ge1xyXG4gICAgICAgIGlmIChpc1N0YXJ0KSB7XHJcbiAgICAgICAgICAgIHRoaXMudG9nZ2xlRXhwb3J0QnV0dG9uKHRydWUpO1xyXG4gICAgICAgICAgICB0aGlzLndhaXRpbmcuc3RhcnQoZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJhZGRpbkNvbnRhaW5lclwiKS5wYXJlbnRFbGVtZW50LCA5OTk5KTtcclxuICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICB0aGlzLnRvZ2dsZUV4cG9ydEJ1dHRvbihmYWxzZSk7XHJcbiAgICAgICAgICAgIHRoaXMud2FpdGluZy5zdG9wKCk7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIHByaXZhdGUgc2hvd0VudGl0eU1lc3NhZ2UgKGJsb2NrOiBIVE1MRWxlbWVudCwgcXR5OiBudW1iZXIsIGVudGl0eU5hbWU6IHN0cmluZykge1xyXG4gICAgICAgIGxldCBibG9ja0VsID0gYmxvY2sucXVlcnlTZWxlY3RvcihcIi5kZXNjcmlwdGlvblwiKTtcclxuICAgICAgICBpZiAocXR5KSB7XHJcbiAgICAgICAgICAgIHF0eSA+IDEgJiYgKGVudGl0eU5hbWUgKz0gXCJzXCIpO1xyXG4gICAgICAgICAgICBsZXQgaGFzSXRlbXNNZXNzYWdlVGVtcGxhdGUgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcImhhc0l0ZW1zTWVzc2FnZVRlbXBsYXRlXCIpLmlubmVySFRNTDtcclxuICAgICAgICAgICAgYmxvY2tFbC5pbm5lckhUTUwgPSBoYXNJdGVtc01lc3NhZ2VUZW1wbGF0ZS5yZXBsYWNlKFwie3F1YW50aXR5fVwiLCBxdHkudG9TdHJpbmcoKSkucmVwbGFjZShcIntlbnRpdHl9XCIsIGVudGl0eU5hbWUpO1xyXG4gICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgIGJsb2NrRWwuaW5uZXJIVE1MID0gYFlvdSBoYXZlIDxzcGFuIGNsYXNzPVwiYm9sZFwiPm5vdCBjb25maWd1cmVkIGFueSAkeyBlbnRpdHlOYW1lIH1zPC9zcGFuPi5gO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICBwcml2YXRlIHJlYWRvbmx5IHRvZ2dsZVRoaXNBZGRpbkluY2x1ZGVkID0gKGU6IEV2ZW50KSA9PiB7XHJcbiAgICAgICAgbGV0IGlzQ2hlY2tlZCA9ICEhZS50YXJnZXQgJiYgISEoPEhUTUxJbnB1dEVsZW1lbnQ+ZS50YXJnZXQpLmNoZWNrZWQ7XHJcbiAgICAgICAgbGV0IGFkZGluc0Jsb2NrOiBIVE1MRWxlbWVudCA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwiZXhwb3J0ZWRBZGRpbnNcIik7XHJcbiAgICAgICAgbGV0IGFkZGluc0RhdGEgPSB0aGlzLm1pc2NCdWlsZGVyLmdldEFkZGluc0RhdGEoIWlzQ2hlY2tlZCk7XHJcbiAgICAgICAgdGhpcy5zaG93RW50aXR5TWVzc2FnZShhZGRpbnNCbG9jaywgYWRkaW5zRGF0YS5sZW5ndGgsIFwiYWRkaW5cIik7XHJcbiAgICAgICAgdGhpcy5kYXRhLm1pc2MuYWRkaW5zID0gYWRkaW5zRGF0YTtcclxuICAgIH1cclxuXHJcbiAgICBjb25zdHJ1Y3RvciAoYXBpKSB7XHJcbiAgICAgICAgdGhpcy5hcGkgPSBhcGk7XHJcbiAgICAgICAgdGhpcy5ncm91cHNCdWlsZGVyID0gbmV3IEdyb3Vwc0J1aWxkZXIoYXBpKTtcclxuICAgICAgICB0aGlzLnNlY3VyaXR5Q2xlYXJhbmNlc0J1aWxkZXIgPSBuZXcgU2VjdXJpdHlDbGVhcmFuY2VzQnVpbGRlcihhcGkpO1xyXG4gICAgICAgIHRoaXMucmVwb3J0c0J1aWxkZXIgPSBuZXcgUmVwb3J0c0J1aWxkZXIoYXBpKTtcclxuICAgICAgICB0aGlzLnJ1bGVzQnVpbGRlciA9IG5ldyBSdWxlc0J1aWxkZXIoYXBpKTtcclxuICAgICAgICB0aGlzLmRpc3RyaWJ1dGlvbkxpc3RzQnVpbGRlciA9IG5ldyBEaXN0cmlidXRpb25MaXN0c0J1aWxkZXIoYXBpKTtcclxuICAgICAgICB0aGlzLm1pc2NCdWlsZGVyID0gbmV3IE1pc2NCdWlsZGVyKGFwaSk7XHJcbiAgICAgICAgdGhpcy53YWl0aW5nID0gbmV3IFdhaXRpbmcoKTtcclxuICAgIH1cclxuXHJcbiAgICBleHBvcnREYXRhID0gKCkgPT4ge1xyXG4gICAgICAgIHRoaXMudG9nZ2xlV2FpdGluZyh0cnVlKTtcclxuICAgICAgICByZXR1cm4gdGhpcy5yZXBvcnRzQnVpbGRlci5nZXREYXRhKCkudGhlbigocmVwb3J0c0RhdGEpID0+IHtcclxuICAgICAgICAgICAgdGhpcy5kYXRhLnJlcG9ydHMgPSByZXBvcnRzRGF0YTtcclxuICAgICAgICAgICAgY29uc29sZS5sb2codGhpcy5kYXRhKTtcclxuICAgICAgICAgICAgZG93bmxvYWREYXRhQXNGaWxlKEpTT04uc3RyaW5naWZ5KHRoaXMuZGF0YSksIFwiZXhwb3J0Lmpzb25cIik7XHJcbiAgICAgICAgfSkuY2F0Y2goKGUpID0+IHtcclxuICAgICAgICAgICAgYWxlcnQoXCJDYW4ndCBleHBvcnQgZGF0YS5cXG5QbGVhc2UgdHJ5IGFnYWluIGxhdGVyLlwiKTtcclxuICAgICAgICAgICAgY29uc29sZS5lcnJvcihlKTtcclxuICAgICAgICB9KS5maW5hbGx5KCgpID0+IHRoaXMudG9nZ2xlV2FpdGluZygpKTtcclxuICAgIH1cclxuXHJcbiAgICByZW5kZXIgKCkge1xyXG4gICAgICAgIGxldCBtYXBNZXNzYWdlVGVtcGxhdGU6IHN0cmluZyA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwibWFwTWVzc2FnZVRlbXBsYXRlXCIpLmlubmVySFRNTCxcclxuICAgICAgICAgICAgZ3JvdXBzQmxvY2s6IEhUTUxFbGVtZW50ID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJleHBvcnRlZEdyb3Vwc1wiKSxcclxuICAgICAgICAgICAgc2VjdXJpdHlDbGVhcmFuY2VzQmxvY2s6IEhUTUxFbGVtZW50ID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJleHBvcnRlZFNlY3VyaXR5Q2xlYXJhbmNlc1wiKSxcclxuICAgICAgICAgICAgcnVsZXNCbG9jazogSFRNTEVsZW1lbnQgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcImV4cG9ydGVkUnVsZXNcIiksXHJcbiAgICAgICAgICAgIHJlcG9ydHNCbG9jazogSFRNTEVsZW1lbnQgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcImV4cG9ydGVkUmVwb3J0c1wiKSxcclxuICAgICAgICAgICAgZGFzaGJvYXJkc0Jsb2NrOiBIVE1MRWxlbWVudCA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwiZXhwb3J0ZWREYXNoYm9hcmRzXCIpLFxyXG4gICAgICAgICAgICBhZGRpbnNCbG9jazogSFRNTEVsZW1lbnQgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcImV4cG9ydGVkQWRkaW5zXCIpLFxyXG4gICAgICAgICAgICB0aGlzQWRkaW5CbG9jazogSFRNTEVsZW1lbnQgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcImluY2x1ZGVUaGlzQWRkaW5cIiksXHJcbiAgICAgICAgICAgIHRoaXNBZGRpbkluY2x1ZGVkQ2hlY2tib3g6IEhUTUxFbGVtZW50ID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcihcIiNpbmNsdWRlVGhpc0FkZGluID4gaW5wdXRcIiksXHJcbiAgICAgICAgICAgIG1hcEJsb2NrRGVzY3JpcHRpb246IEhUTUxFbGVtZW50ID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcihcIiNleHBvcnRlZE1hcCA+IC5kZXNjcmlwdGlvblwiKTtcclxuICAgICAgICB0aGlzLmV4cG9ydEJ0bi5hZGRFdmVudExpc3RlbmVyKFwiY2xpY2tcIiwgdGhpcy5leHBvcnREYXRhLCBmYWxzZSk7XHJcbiAgICAgICAgdGhpc0FkZGluSW5jbHVkZWRDaGVja2JveC5hZGRFdmVudExpc3RlbmVyKFwiY2hhbmdlXCIsIHRoaXMudG9nZ2xlVGhpc0FkZGluSW5jbHVkZWQsIGZhbHNlKTtcclxuICAgICAgICB0aGlzLnRvZ2dsZVdhaXRpbmcodHJ1ZSk7XHJcbiAgICAgICAgcmV0dXJuIHRvZ2V0aGVyKFtcclxuICAgICAgICAgICAgdGhpcy5ncm91cHNCdWlsZGVyLmZldGNoKCksXHJcbiAgICAgICAgICAgIHRoaXMuc2VjdXJpdHlDbGVhcmFuY2VzQnVpbGRlci5mZXRjaCgpLFxyXG4gICAgICAgICAgICB0aGlzLnJlcG9ydHNCdWlsZGVyLmZldGNoKCksXHJcbiAgICAgICAgICAgIHRoaXMucnVsZXNCdWlsZGVyLmZldGNoKCksXHJcbiAgICAgICAgICAgIHRoaXMuZGlzdHJpYnV0aW9uTGlzdHNCdWlsZGVyLmZldGNoKCksXHJcbiAgICAgICAgICAgIHRoaXMubWlzY0J1aWxkZXIuZmV0Y2goKVxyXG4gICAgICAgIF0pLnRoZW4oKHJlc3VsdHMpID0+IHtcclxuICAgICAgICAgICAgbGV0IHJlcG9ydHNEZXBlbmRlbmNpZXM6IElEZXBlbmRlbmNpZXMsXHJcbiAgICAgICAgICAgICAgICBydWxlc0RlcGVuZGVuY2llczogSURlcGVuZGVuY2llcyxcclxuICAgICAgICAgICAgICAgIGRpc3RyaWJ1dGlvbkxpc3RzRGVwZW5kZW5jaWVzOiBJRGVwZW5kZW5jaWVzLFxyXG4gICAgICAgICAgICAgICAgZGVwZW5kZW5jaWVzOiBJRGVwZW5kZW5jaWVzLFxyXG4gICAgICAgICAgICAgICAgY3VzdG9tTWFwO1xyXG4gICAgICAgICAgICB0aGlzLmRhdGEuZ3JvdXBzID0gcmVzdWx0c1swXTtcclxuICAgICAgICAgICAgdGhpcy5kYXRhLnNlY3VyaXR5R3JvdXBzID0gcmVzdWx0c1sxXTtcclxuICAgICAgICAgICAgdGhpcy5kYXRhLnJlcG9ydHMgPSByZXN1bHRzWzJdO1xyXG4gICAgICAgICAgICB0aGlzLmRhdGEucnVsZXMgPSByZXN1bHRzWzNdO1xyXG4gICAgICAgICAgICB0aGlzLmRhdGEuZGlzdHJpYnV0aW9uTGlzdHMgPSB0aGlzLmRpc3RyaWJ1dGlvbkxpc3RzQnVpbGRlci5nZXRSdWxlc0Rpc3RyaWJ1dGlvbkxpc3RzKHRoaXMuZGF0YS5ydWxlcy5tYXAocnVsZSA9PiBydWxlLmlkKSk7XHJcbiAgICAgICAgICAgIHRoaXMuZGF0YS5taXNjID0gcmVzdWx0c1s1XTtcclxuICAgICAgICAgICAgY3VzdG9tTWFwID0gdGhpcy5taXNjQnVpbGRlci5nZXRNYXBQcm92aWRlckRhdGEodGhpcy5kYXRhLm1pc2MubWFwUHJvdmlkZXIudmFsdWUpO1xyXG4gICAgICAgICAgICBjdXN0b21NYXAgJiYgdGhpcy5kYXRhLmN1c3RvbU1hcHMucHVzaChjdXN0b21NYXApO1xyXG4gICAgICAgICAgICByZXBvcnRzRGVwZW5kZW5jaWVzID0gdGhpcy5yZXBvcnRzQnVpbGRlci5nZXREZXBlbmRlbmNpZXModGhpcy5kYXRhLnJlcG9ydHMpO1xyXG4gICAgICAgICAgICBydWxlc0RlcGVuZGVuY2llcyA9IHRoaXMucnVsZXNCdWlsZGVyLmdldERlcGVuZGVuY2llcyh0aGlzLmRhdGEucnVsZXMpO1xyXG4gICAgICAgICAgICBkaXN0cmlidXRpb25MaXN0c0RlcGVuZGVuY2llcyA9IHRoaXMuZGlzdHJpYnV0aW9uTGlzdHNCdWlsZGVyLmdldERlcGVuZGVuY2llcyh0aGlzLmRhdGEuZGlzdHJpYnV0aW9uTGlzdHMpO1xyXG4gICAgICAgICAgICBkZXBlbmRlbmNpZXMgPSB0aGlzLmNvbWJpbmVEZXBlbmRlbmNpZXMocmVwb3J0c0RlcGVuZGVuY2llcywgcnVsZXNEZXBlbmRlbmNpZXMsIGRpc3RyaWJ1dGlvbkxpc3RzRGVwZW5kZW5jaWVzKTtcclxuICAgICAgICAgICAgcmV0dXJuIHRoaXMucmVzb2x2ZURlcGVuZGVuY2llcyhkZXBlbmRlbmNpZXMsIHRoaXMuZGF0YSk7XHJcbiAgICAgICAgfSkudGhlbigoKSA9PiB7XHJcbiAgICAgICAgICAgIGxldCBtYXBQcm92aWRlciA9IHRoaXMubWlzY0J1aWxkZXIuZ2V0TWFwUHJvdmlkZXJOYW1lKHRoaXMuZGF0YS5taXNjLm1hcFByb3ZpZGVyLnZhbHVlKTtcclxuICAgICAgICAgICAgdGhpcy5zaG93RW50aXR5TWVzc2FnZShncm91cHNCbG9jaywgdGhpcy5kYXRhLmdyb3Vwcy5sZW5ndGggLSAxLCBcImdyb3VwXCIpO1xyXG4gICAgICAgICAgICB0aGlzLnNob3dFbnRpdHlNZXNzYWdlKHNlY3VyaXR5Q2xlYXJhbmNlc0Jsb2NrLCB0aGlzLmRhdGEuc2VjdXJpdHlHcm91cHMubGVuZ3RoLCBcInNlY3VyaXR5IGNsZWFyYW5jZVwiKTtcclxuICAgICAgICAgICAgdGhpcy5zaG93RW50aXR5TWVzc2FnZShydWxlc0Jsb2NrLCB0aGlzLmRhdGEucnVsZXMubGVuZ3RoLCBcInJ1bGVcIik7XHJcbiAgICAgICAgICAgIHRoaXMuc2hvd0VudGl0eU1lc3NhZ2UocmVwb3J0c0Jsb2NrLCB0aGlzLnJlcG9ydHNCdWlsZGVyLmdldEN1c3RvbWl6ZWRSZXBvcnRzUXR5KCksIFwicmVwb3J0XCIpO1xyXG4gICAgICAgICAgICB0aGlzLnNob3dFbnRpdHlNZXNzYWdlKGRhc2hib2FyZHNCbG9jaywgdGhpcy5yZXBvcnRzQnVpbGRlci5nZXREYXNoYm9hcmRzUXR5KCksIFwiZGFzaGJvYXJkXCIpO1xyXG4gICAgICAgICAgICBtYXBQcm92aWRlciAmJiAobWFwQmxvY2tEZXNjcmlwdGlvbi5pbm5lckhUTUwgPSBtYXBNZXNzYWdlVGVtcGxhdGUucmVwbGFjZShcInttYXBQcm92aWRlcn1cIiwgbWFwUHJvdmlkZXIpKTtcclxuICAgICAgICAgICAgdGhpcy5zaG93RW50aXR5TWVzc2FnZShhZGRpbnNCbG9jaywgdGhpcy5kYXRhLm1pc2MuYWRkaW5zLmxlbmd0aCwgXCJhZGRpblwiKTtcclxuICAgICAgICAgICAgdGhpcy5taXNjQnVpbGRlci5pc1RoaXNBZGRpbkluY2x1ZGVkKCkgJiYgdGhpc0FkZGluQmxvY2suY2xhc3NMaXN0LnJlbW92ZShcImhpZGRlblwiKTtcclxuICAgICAgICAgICAgY29uc29sZS5sb2codGhpcy5kYXRhKTtcclxuICAgICAgICB9KS5jYXRjaCgoZSkgPT4ge1xyXG4gICAgICAgICAgICBjb25zb2xlLmVycm9yKGUpO1xyXG4gICAgICAgICAgICBhbGVydChcIkNhbid0IGdldCBjb25maWcgdG8gZXhwb3J0XCIpO1xyXG4gICAgICAgIH0pLmZpbmFsbHkoKCkgPT4gdGhpcy50b2dnbGVXYWl0aW5nKCkpO1xyXG4gICAgfVxyXG5cclxuICAgIHVubG9hZCAoKSB7XHJcbiAgICAgICAgdGhpcy5hYm9ydEN1cnJlbnRUYXNrKCk7XHJcbiAgICAgICAgdGhpcy5ncm91cHNCdWlsZGVyLnVubG9hZCgpO1xyXG4gICAgICAgIHRoaXMuc2VjdXJpdHlDbGVhcmFuY2VzQnVpbGRlci51bmxvYWQoKTtcclxuICAgICAgICB0aGlzLnJlcG9ydHNCdWlsZGVyLnVubG9hZCgpO1xyXG4gICAgICAgIHRoaXMucnVsZXNCdWlsZGVyLnVubG9hZCgpO1xyXG4gICAgICAgIHRoaXMuZGlzdHJpYnV0aW9uTGlzdHNCdWlsZGVyLnVubG9hZCgpO1xyXG4gICAgICAgIHRoaXMubWlzY0J1aWxkZXIudW5sb2FkKCk7XHJcbiAgICAgICAgdGhpcy5leHBvcnRCdG4ucmVtb3ZlRXZlbnRMaXN0ZW5lcihcImNsaWNrXCIsIHRoaXMuZXhwb3J0RGF0YSwgZmFsc2UpO1xyXG4gICAgfVxyXG59XHJcblxyXG5nZW90YWIuYWRkaW4ucmVnaXN0cmF0aW9uQ29uZmlnID0gZnVuY3Rpb24gKCkge1xyXG4gICAgbGV0IGFkZGluOiBBZGRpbjtcclxuXHJcbiAgICByZXR1cm4ge1xyXG4gICAgICAgIGluaXRpYWxpemU6IChhcGksIHN0YXRlLCBjYWxsYmFjaykgPT4ge1xyXG4gICAgICAgICAgICBhZGRpbiA9IG5ldyBBZGRpbihhcGkpO1xyXG4gICAgICAgICAgICBjYWxsYmFjaygpO1xyXG4gICAgICAgIH0sXHJcbiAgICAgICAgZm9jdXM6ICgpID0+IHtcclxuICAgICAgICAgICAgYWRkaW4ucmVuZGVyKCk7XHJcbiAgICAgICAgfSxcclxuICAgICAgICBibHVyOiAoKSA9PiB7XHJcbiAgICAgICAgICAgIGFkZGluLnVubG9hZCgpO1xyXG4gICAgICAgIH1cclxuICAgIH07XHJcbn07IiwiLy8vIDxyZWZlcmVuY2UgcGF0aD1cIi4uL2JsdWViaXJkLmQudHNcIi8+XHJcbmltcG9ydCB7ZW50aXR5VG9EaWN0aW9uYXJ5LCBtZXJnZVVuaXF1ZX0gZnJvbSBcIi4vdXRpbHNcIjtcclxuXHJcbmludGVyZmFjZSBJRGlzdHJpYnV0aW9uTGlzdCB7XHJcbiAgICBpZDogc3RyaW5nO1xyXG4gICAgbmFtZTogc3RyaW5nO1xyXG4gICAgcmVjaXBpZW50czogYW55W107XHJcbiAgICBydWxlczogYW55W107XHJcbn1cclxuXHJcbmV4cG9ydCBpbnRlcmZhY2UgSURpc3RyaWJ1dGlvbkxpc3REZXBlbmRlbmNpZXMge1xyXG4gICAgcnVsZXM/OiBhbnlbXTtcclxuICAgIHVzZXJzPzogYW55W107XHJcbiAgICBub3RpZmljYXRpb25UZW1wbGF0ZXM/OiBhbnlbXTtcclxuICAgIGdyb3Vwcz86IGFueVtdO1xyXG59XHJcblxyXG5leHBvcnQgZGVmYXVsdCBjbGFzcyBEaXN0cmlidXRpb25MaXN0c0J1aWxkZXIge1xyXG4gICAgcHJpdmF0ZSBhcGk7XHJcbiAgICBwcml2YXRlIGN1cnJlbnRUYXNrO1xyXG4gICAgcHJpdmF0ZSBkaXN0cmlidXRpb25MaXN0cztcclxuICAgIHByaXZhdGUgbm90aWZpY2F0aW9uVGVtcGxhdGVzO1xyXG5cclxuICAgIGNvbnN0cnVjdG9yKGFwaSkge1xyXG4gICAgICAgIHRoaXMuYXBpID0gYXBpO1xyXG4gICAgfVxyXG5cclxuICAgIHByaXZhdGUgZ2V0RGlzdHJpYnV0aW9uTGlzdHNEYXRhICgpOiBQcm9taXNlPGFueT4ge1xyXG4gICAgICAgIHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XHJcbiAgICAgICAgICAgIHRoaXMuYXBpLm11bHRpQ2FsbChbXHJcbiAgICAgICAgICAgICAgICBbXCJHZXRcIiwge1xyXG4gICAgICAgICAgICAgICAgICAgIFwidHlwZU5hbWVcIjogXCJEaXN0cmlidXRpb25MaXN0XCIsXHJcbiAgICAgICAgICAgICAgICB9XSxcclxuICAgICAgICAgICAgICAgIFtcIkdldE5vdGlmaWNhdGlvbldlYlJlcXVlc3RUZW1wbGF0ZXNcIiwge31dLFxyXG4gICAgICAgICAgICAgICAgW1wiR2V0Tm90aWZpY2F0aW9uRW1haWxUZW1wbGF0ZXNcIiwge31dLFxyXG4gICAgICAgICAgICAgICAgW1wiR2V0Tm90aWZpY2F0aW9uVGV4dFRlbXBsYXRlc1wiLCB7fV1cclxuICAgICAgICAgICAgXSwgcmVzb2x2ZSwgcmVqZWN0KTtcclxuICAgICAgICB9KTtcclxuICAgIH07XHJcblxyXG4gICAgcHJpdmF0ZSBhYm9ydEN1cnJlbnRUYXNrICgpOiB2b2lkIHtcclxuICAgICAgICB0aGlzLmN1cnJlbnRUYXNrICYmIHRoaXMuY3VycmVudFRhc2suYWJvcnQgJiYgdGhpcy5jdXJyZW50VGFzay5hYm9ydCgpO1xyXG4gICAgICAgIHRoaXMuY3VycmVudFRhc2sgPSBudWxsO1xyXG4gICAgfTtcclxuXHJcbiAgICBwdWJsaWMgZ2V0RGVwZW5kZW5jaWVzIChkaXN0cmlidXRpb25MaXN0cyk6IElEaXN0cmlidXRpb25MaXN0RGVwZW5kZW5jaWVzIHtcclxuICAgICAgICBsZXQgZGVwZW5kZW5jaWVzOiBJRGlzdHJpYnV0aW9uTGlzdERlcGVuZGVuY2llcyA9IHtcclxuICAgICAgICAgICAgICAgIHJ1bGVzOiBbXSxcclxuICAgICAgICAgICAgICAgIHVzZXJzOiBbXSxcclxuICAgICAgICAgICAgICAgIGdyb3VwczogW10sXHJcbiAgICAgICAgICAgICAgICBub3RpZmljYXRpb25UZW1wbGF0ZXM6IFtdXHJcbiAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgIHByb2Nlc3NEZXBlbmRlbmNpZXMgPSAocmVjaXBpZW50KSA9PiB7XHJcbiAgICAgICAgICAgICAgICBsZXQgaWQsIHR5cGU6IHN0cmluZyxcclxuICAgICAgICAgICAgICAgICAgICB1c2VySWQgPSByZWNpcGllbnQudXNlci5pZDtcclxuICAgICAgICAgICAgICAgIHVzZXJJZCAmJiBkZXBlbmRlbmNpZXMudXNlcnMuaW5kZXhPZih1c2VySWQpID09PSAtMSAmJiBkZXBlbmRlbmNpZXMudXNlcnMucHVzaCh1c2VySWQpO1xyXG4gICAgICAgICAgICAgICAgc3dpdGNoIChyZWNpcGllbnQucmVjaXBpZW50VHlwZSkge1xyXG4gICAgICAgICAgICAgICAgICAgIGNhc2UgXCJFbWFpbFwiOlxyXG4gICAgICAgICAgICAgICAgICAgIGNhc2UgXCJMb2dQb3B1cFwiOlxyXG4gICAgICAgICAgICAgICAgICAgIGNhc2UgXCJMb2dVcmdlbnRQb3B1cFwiOlxyXG4gICAgICAgICAgICAgICAgICAgIGNhc2UgXCJMb2dPbmx5XCI6XHJcbiAgICAgICAgICAgICAgICAgICAgY2FzZSBcIlRleHRNZXNzYWdlXCI6XHJcbiAgICAgICAgICAgICAgICAgICAgY2FzZSBcIlRleHRUb1NwZWVjaEFsbG93RGVsYXlcIjpcclxuICAgICAgICAgICAgICAgICAgICBjYXNlIFwiV2ViUmVxdWVzdFwiOlxyXG4gICAgICAgICAgICAgICAgICAgIGNhc2UgXCJUZXh0VG9TcGVlY2hcIjpcclxuICAgICAgICAgICAgICAgICAgICAgICAgaWQgPSByZWNpcGllbnQubm90aWZpY2F0aW9uQmluYXJ5RmlsZSAmJiByZWNpcGllbnQubm90aWZpY2F0aW9uQmluYXJ5RmlsZS5pZDtcclxuICAgICAgICAgICAgICAgICAgICAgICAgdHlwZSA9IFwibm90aWZpY2F0aW9uVGVtcGxhdGVzXCI7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgICAgICAgICAgICAgIGNhc2UgXCJBc3NpZ25Ub0dyb3VwXCI6XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGlkID0gcmVjaXBpZW50Lmdyb3VwICYmIHJlY2lwaWVudC5ncm91cC5pZDtcclxuICAgICAgICAgICAgICAgICAgICAgICAgdHlwZSA9IFwiZ3JvdXBzXCI7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgaWQgJiYgdHlwZSAmJiBkZXBlbmRlbmNpZXNbdHlwZV0uaW5kZXhPZihpZCkgPT09IC0xICYmIGRlcGVuZGVuY2llc1t0eXBlXS5wdXNoKGlkKTtcclxuICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgY2hlY2tSZWNpcGllbnRzID0gKHJlY2lwaWVudHMsIGRlcGVuZGVuY2llczogSURpc3RyaWJ1dGlvbkxpc3REZXBlbmRlbmNpZXMpOiBJRGlzdHJpYnV0aW9uTGlzdERlcGVuZGVuY2llcyA9PiB7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gcmVjaXBpZW50cy5yZWR1Y2UoKGRlcGVuZGVuY2llcywgcmVjaXBpZW50KSA9PiB7XHJcbiAgICAgICAgICAgICAgICAgICAgcHJvY2Vzc0RlcGVuZGVuY2llcyhyZWNpcGllbnQpO1xyXG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBkZXBlbmRlbmNpZXM7XHJcbiAgICAgICAgICAgICAgICB9LCBkZXBlbmRlbmNpZXMpO1xyXG4gICAgICAgICAgICB9O1xyXG4gICAgICAgIHJldHVybiBkaXN0cmlidXRpb25MaXN0cy5yZWR1Y2UoKGRlcGVuZGVuY2llczogSURpc3RyaWJ1dGlvbkxpc3REZXBlbmRlbmNpZXMsIGRpc3RyaWJ1dGlvbkxpc3Q6IElEaXN0cmlidXRpb25MaXN0KSA9PiB7XHJcbiAgICAgICAgICAgIGRlcGVuZGVuY2llcy5ydWxlcyA9IG1lcmdlVW5pcXVlKGRlcGVuZGVuY2llcy5ydWxlcywgZGlzdHJpYnV0aW9uTGlzdC5ydWxlcy5tYXAocnVsZSA9PiBydWxlLmlkKSk7XHJcbiAgICAgICAgICAgIGRlcGVuZGVuY2llcyA9IGNoZWNrUmVjaXBpZW50cyhkaXN0cmlidXRpb25MaXN0LnJlY2lwaWVudHMsIGRlcGVuZGVuY2llcyk7XHJcbiAgICAgICAgICAgIHJldHVybiBkZXBlbmRlbmNpZXM7XHJcbiAgICAgICAgfSwgZGVwZW5kZW5jaWVzKTtcclxuICAgIH07XHJcblxyXG4gICAgcHVibGljIGZldGNoKCk6IFByb21pc2U8YW55PiB7XHJcbiAgICAgICAgdGhpcy5hYm9ydEN1cnJlbnRUYXNrKCk7XHJcbiAgICAgICAgdGhpcy5jdXJyZW50VGFzayA9IHRoaXMuZ2V0RGlzdHJpYnV0aW9uTGlzdHNEYXRhKClcclxuICAgICAgICAgICAgLnRoZW4oKFtkaXN0cmlidXRpb25MaXN0cywgd2ViVGVtcGxhdGVzLCBlbWFpbFRlbXBsYXRlcywgdGV4dFRlbXBsYXRlc10pID0+IHtcclxuICAgICAgICAgICAgICAgIHRoaXMuZGlzdHJpYnV0aW9uTGlzdHMgPSBlbnRpdHlUb0RpY3Rpb25hcnkoZGlzdHJpYnV0aW9uTGlzdHMpO1xyXG4gICAgICAgICAgICAgICAgdGhpcy5ub3RpZmljYXRpb25UZW1wbGF0ZXMgPSBlbnRpdHlUb0RpY3Rpb25hcnkod2ViVGVtcGxhdGVzLmNvbmNhdChlbWFpbFRlbXBsYXRlcykuY29uY2F0KHRleHRUZW1wbGF0ZXMpKTtcclxuICAgICAgICAgICAgICAgIHJldHVybiB0aGlzLmRpc3RyaWJ1dGlvbkxpc3RzO1xyXG4gICAgICAgICAgICB9KVxyXG4gICAgICAgICAgICAuY2F0Y2goY29uc29sZS5lcnJvcilcclxuICAgICAgICAgICAgLmZpbmFsbHkoKCkgPT4ge1xyXG4gICAgICAgICAgICAgICAgdGhpcy5jdXJyZW50VGFzayA9IG51bGw7XHJcbiAgICAgICAgICAgIH0pO1xyXG4gICAgICAgIHJldHVybiB0aGlzLmN1cnJlbnRUYXNrO1xyXG4gICAgfTtcclxuXHJcbiAgICBwdWJsaWMgZ2V0Tm90aWZpY2F0aW9uVGVtcGxhdGVEYXRhICh0ZW1wbGF0ZUlkOiBzdHJpbmcpOiBhbnkge1xyXG4gICAgICAgIHJldHVybiB0aGlzLm5vdGlmaWNhdGlvblRlbXBsYXRlc1t0ZW1wbGF0ZUlkXTtcclxuICAgIH07XHJcblxyXG4gICAgcHVibGljIGdldFJ1bGVzRGlzdHJpYnV0aW9uTGlzdHMgKHJ1bGVzSWRzOiBzdHJpbmdbXSk6IElEaXN0cmlidXRpb25MaXN0W10ge1xyXG4gICAgICAgIHJldHVybiBPYmplY3Qua2V5cyh0aGlzLmRpc3RyaWJ1dGlvbkxpc3RzKS5yZWR1Y2UoKHJlcywgaWQpID0+IHtcclxuICAgICAgICAgICAgbGV0IGxpc3QgPSB0aGlzLmRpc3RyaWJ1dGlvbkxpc3RzW2lkXTtcclxuICAgICAgICAgICAgbGlzdC5ydWxlcy5zb21lKGxpc3RSdWxlID0+IHJ1bGVzSWRzLmluZGV4T2YobGlzdFJ1bGUuaWQpID4gLTEpICYmIHJlcy5wdXNoKGxpc3QpO1xyXG4gICAgICAgICAgICByZXR1cm4gcmVzO1xyXG4gICAgICAgIH0sIFtdKTtcclxuICAgIH07XHJcblxyXG4gICAgcHVibGljIHVubG9hZCAoKTogdm9pZCB7XHJcbiAgICAgICAgdGhpcy5hYm9ydEN1cnJlbnRUYXNrKCk7XHJcbiAgICB9O1xyXG59IiwiLy8vIDxyZWZlcmVuY2UgcGF0aD1cIi4uL2JsdWViaXJkLmQudHNcIi8+XHJcbmltcG9ydCAqIGFzIFV0aWxzIGZyb20gXCIuL3V0aWxzXCI7XHJcblxyXG5pbnRlcmZhY2UgQ29sb3Ige1xyXG4gICAgcjogbnVtYmVyO1xyXG4gICAgZzogbnVtYmVyO1xyXG4gICAgYjogbnVtYmVyO1xyXG4gICAgYTogbnVtYmVyO1xyXG59XHJcblxyXG5pbnRlcmZhY2UgSUdyb3VwIHtcclxuICAgIGlkOiBzdHJpbmc7XHJcbiAgICBuYW1lPzogc3RyaW5nO1xyXG4gICAgY29sb3I/OiBDb2xvcjtcclxuICAgIHBhcmVudD86IElHcm91cDtcclxuICAgIGNoaWxkcmVuPzogSUdyb3VwW107XHJcbiAgICB1c2VyPzogYW55O1xyXG59XHJcblxyXG5leHBvcnQgZGVmYXVsdCBjbGFzcyBHcm91cHNCdWlsZGVyIHtcclxuICAgIHByb3RlY3RlZCBhcGk7XHJcbiAgICBwcm90ZWN0ZWQgY3VycmVudFRhc2s7XHJcbiAgICBwcm90ZWN0ZWQgZ3JvdXBzOiBJR3JvdXBbXTtcclxuICAgIHByb3RlY3RlZCB0cmVlOiBJR3JvdXBbXTtcclxuICAgIHByb3RlY3RlZCBjdXJyZW50VHJlZTtcclxuXHJcbiAgICBwcml2YXRlIHVzZXJzOiBhbnk7XHJcbiAgICBwcml2YXRlIGN1cnJlbnRVc2VyTmFtZTogc3RyaW5nO1xyXG5cclxuICAgIGNvbnN0cnVjdG9yKGFwaTogYW55KSB7XHJcbiAgICAgICAgdGhpcy5hcGkgPSBhcGk7XHJcbiAgICB9XHJcblxyXG4gICAgcHJpdmF0ZSBnZXRHcm91cHMgKCk6IFByb21pc2U8YW55PiB7XHJcbiAgICAgICAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlLCByZWplY3QpID0+IHtcclxuICAgICAgICAgICAgdGhpcy5hcGkuZ2V0U2Vzc2lvbigoc2Vzc2lvbkRhdGEpID0+IHtcclxuICAgICAgICAgICAgICAgIHRoaXMuY3VycmVudFVzZXJOYW1lID0gc2Vzc2lvbkRhdGEudXNlck5hbWU7XHJcbiAgICAgICAgICAgICAgICB0aGlzLmFwaS5tdWx0aUNhbGwoW1xyXG4gICAgICAgICAgICAgICAgICAgIFtcIkdldFwiLCB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHR5cGVOYW1lOiBcIkdyb3VwXCJcclxuICAgICAgICAgICAgICAgICAgICB9XSxcclxuICAgICAgICAgICAgICAgICAgICBbXCJHZXRcIiwge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB0eXBlTmFtZTogXCJVc2VyXCJcclxuICAgICAgICAgICAgICAgICAgICB9XVxyXG4gICAgICAgICAgICAgICAgXSwgcmVzb2x2ZSwgcmVqZWN0KTtcclxuICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgfSk7XHJcbiAgICB9O1xyXG5cclxuICAgIHByaXZhdGUgZmluZENoaWxkIChjaGlsZElkOiBzdHJpbmcsIGN1cnJlbnRJdGVtOiBJR3JvdXAsIG9uQWxsTGV2ZWxzOiBib29sZWFuID0gZmFsc2UpOiBJR3JvdXAge1xyXG4gICAgICAgIGxldCBmb3VuZENoaWxkID0gbnVsbCxcclxuICAgICAgICAgICAgY2hpbGRyZW4gPSBjdXJyZW50SXRlbS5jaGlsZHJlbjtcclxuICAgICAgICBpZiAoIWNoaWxkSWQgfHwgIWNoaWxkcmVuIHx8ICFjaGlsZHJlbi5sZW5ndGgpIHtcclxuICAgICAgICAgICAgcmV0dXJuIG51bGw7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBjaGlsZHJlbi5zb21lKGNoaWxkID0+IHtcclxuICAgICAgICAgICAgaWYgKGNoaWxkLmlkID09PSBjaGlsZElkKSB7XHJcbiAgICAgICAgICAgICAgICBmb3VuZENoaWxkID0gY2hpbGQ7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gZm91bmRDaGlsZDtcclxuICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICAgIGlmIChvbkFsbExldmVscykge1xyXG4gICAgICAgICAgICAgICAgICAgIGZvdW5kQ2hpbGQgPSB0aGlzLmZpbmRDaGlsZChjaGlsZElkLCBjaGlsZCwgb25BbGxMZXZlbHMpO1xyXG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBmb3VuZENoaWxkO1xyXG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gZmFsc2U7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9KTtcclxuXHJcbiAgICAgICAgcmV0dXJuIGZvdW5kQ2hpbGQ7XHJcbiAgICB9O1xyXG5cclxuICAgIHByaXZhdGUgZ2V0VXNlckJ5UHJpdmF0ZUdyb3VwSWQgKGdyb3VwSWQ6IHN0cmluZyk6IGFueSB7XHJcbiAgICAgICAgbGV0IG91dHB1dFVzZXIgPSBudWxsLFxyXG4gICAgICAgICAgICB1c2VySGFzUHJpdmF0ZUdyb3VwID0gKHVzZXIsIGdyb3VwSWQpOiBib29sZWFuID0+IHtcclxuICAgICAgICAgICAgICAgIHJldHVybiB1c2VyLnByaXZhdGVVc2VyR3JvdXBzLnNvbWUoZ3JvdXAgPT4ge1xyXG4gICAgICAgICAgICAgICAgICAgIGlmIChncm91cC5pZCA9PT0gZ3JvdXBJZCkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gdHJ1ZTtcclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgfTtcclxuICAgICAgICB0aGlzLnVzZXJzLnNvbWUodXNlciA9PiB7XHJcbiAgICAgICAgICAgIGlmICh1c2VySGFzUHJpdmF0ZUdyb3VwKHVzZXIsIGdyb3VwSWQpKSB7XHJcbiAgICAgICAgICAgICAgICBvdXRwdXRVc2VyID0gdXNlcjtcclxuICAgICAgICAgICAgICAgIHJldHVybiB0cnVlO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfSk7XHJcbiAgICAgICAgcmV0dXJuIG91dHB1dFVzZXI7XHJcbiAgICB9O1xyXG5cclxuICAgIHByaXZhdGUgZ2V0UHJpdmF0ZUdyb3VwRGF0YSAoZ3JvdXBJZDogc3RyaW5nKSB7XHJcbiAgICAgICAgcmV0dXJuIHtcclxuICAgICAgICAgICAgaWQ6IGdyb3VwSWQsXHJcbiAgICAgICAgICAgIHVzZXI6IHRoaXMuZ2V0VXNlckJ5UHJpdmF0ZUdyb3VwSWQoZ3JvdXBJZCksXHJcbiAgICAgICAgICAgIGNoaWxkcmVuOiBbXSxcclxuICAgICAgICAgICAgbmFtZTogXCJQcml2YXRlVXNlckdyb3VwTmFtZVwiLFxyXG4gICAgICAgICAgICBwYXJlbnQ6IHtcclxuICAgICAgICAgICAgICAgIGlkOiBcIkdyb3VwUHJpdmF0ZVVzZXJJZFwiLFxyXG4gICAgICAgICAgICAgICAgY2hpbGRyZW46IFt7IGlkOiBncm91cElkIH1dXHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9O1xyXG4gICAgfTtcclxuXHJcbiAgICBwcm90ZWN0ZWQgY3JlYXRlR3JvdXBzVHJlZSAoZ3JvdXBzOiBJR3JvdXBbXSk6IGFueVtdIHtcclxuICAgICAgICBsZXQgbm9kZUxvb2t1cCxcclxuICAgICAgICAgICAgdHJhdmVyc2VDaGlsZHJlbiA9IGZ1bmN0aW9uIChub2RlKSB7XHJcbiAgICAgICAgICAgICAgICBsZXQgY2hpbGRyZW46IElHcm91cFtdLFxyXG4gICAgICAgICAgICAgICAgICAgIGlkOiBzdHJpbmc7XHJcblxyXG4gICAgICAgICAgICAgICAgY2hpbGRyZW4gPSBub2RlLmNoaWxkcmVuO1xyXG5cclxuICAgICAgICAgICAgICAgIGlmIChjaGlsZHJlbikge1xyXG4gICAgICAgICAgICAgICAgICAgIGZvciAobGV0IGkgPSAwLCBpaSA9IGNoaWxkcmVuLmxlbmd0aDsgaSA8IGlpOyBpICs9IDEpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgaWQgPSBjaGlsZHJlbltpXS5pZDtcclxuXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChub2RlTG9va3VwW2lkXSkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgbm9kZS5jaGlsZHJlbltpXSA9IG5vZGVMb29rdXBbaWRdO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgbm9kZS5jaGlsZHJlbltpXS5wYXJlbnQgPSBub2RlO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZGVsZXRlIG5vZGVMb29rdXBbaWRdO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHRyYXZlcnNlQ2hpbGRyZW4obm9kZS5jaGlsZHJlbltpXSk7XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9O1xyXG5cclxuICAgICAgICBub2RlTG9va3VwID0gVXRpbHMuZW50aXR5VG9EaWN0aW9uYXJ5KGdyb3VwcywgZW50aXR5ID0+IHtcclxuICAgICAgICAgICAgbGV0IG5ld0VudGl0eSA9IFV0aWxzLmV4dGVuZCh7fSwgZW50aXR5KTtcclxuICAgICAgICAgICAgaWYgKG5ld0VudGl0eS5jaGlsZHJlbikge1xyXG4gICAgICAgICAgICAgICAgbmV3RW50aXR5LmNoaWxkcmVuID0gbmV3RW50aXR5LmNoaWxkcmVuLnNsaWNlKCk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgcmV0dXJuIG5ld0VudGl0eTtcclxuICAgICAgICB9KTtcclxuXHJcbiAgICAgICAgT2JqZWN0LmtleXMobm9kZUxvb2t1cCkuZm9yRWFjaChrZXkgPT4ge1xyXG4gICAgICAgICAgICBub2RlTG9va3VwW2tleV0gJiYgdHJhdmVyc2VDaGlsZHJlbihub2RlTG9va3VwW2tleV0pO1xyXG4gICAgICAgIH0pO1xyXG5cclxuICAgICAgICByZXR1cm4gT2JqZWN0LmtleXMobm9kZUxvb2t1cCkubWFwKGtleSA9PiB7XHJcbiAgICAgICAgICAgIHJldHVybiBub2RlTG9va3VwW2tleV07XHJcbiAgICAgICAgfSk7XHJcbiAgICB9O1xyXG5cclxuICAgIHByb3RlY3RlZCBhYm9ydEN1cnJlbnRUYXNrICgpOiB2b2lkIHtcclxuICAgICAgICB0aGlzLmN1cnJlbnRUYXNrICYmIHRoaXMuY3VycmVudFRhc2suYWJvcnQgJiYgdGhpcy5jdXJyZW50VGFzay5hYm9ydCgpO1xyXG4gICAgICAgIHRoaXMuY3VycmVudFRhc2sgPSBudWxsO1xyXG4gICAgfTtcclxuXHJcbiAgICBwdWJsaWMgZmV0Y2ggKCk6IFByb21pc2U8YW55PiB7XHJcbiAgICAgICAgdGhpcy5hYm9ydEN1cnJlbnRUYXNrKCk7XHJcbiAgICAgICAgdGhpcy5jdXJyZW50VGFzayA9IHRoaXMuZ2V0R3JvdXBzKClcclxuICAgICAgICAgICAgLnRoZW4oKFtncm91cHMsIHVzZXJzXSkgPT4ge1xyXG4gICAgICAgICAgICAgICAgdGhpcy5ncm91cHMgPSBncm91cHM7XHJcbiAgICAgICAgICAgICAgICB0aGlzLnVzZXJzID0gdXNlcnM7XHJcbiAgICAgICAgICAgICAgICB0aGlzLnRyZWUgPSB0aGlzLmNyZWF0ZUdyb3Vwc1RyZWUoZ3JvdXBzKTtcclxuICAgICAgICAgICAgICAgIHRoaXMuY3VycmVudFRyZWUgPSBVdGlscy5leHRlbmQoe30sIHRoaXMudHJlZSk7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gdGhpcy5jcmVhdGVGbGF0R3JvdXBzTGlzdCh0aGlzLnRyZWUpO1xyXG4gICAgICAgICAgICB9KVxyXG4gICAgICAgICAgICAuY2F0Y2goY29uc29sZS5lcnJvcilcclxuICAgICAgICAgICAgLmZpbmFsbHkoKCkgPT4ge1xyXG4gICAgICAgICAgICAgICAgdGhpcy5jdXJyZW50VGFzayA9IG51bGw7XHJcbiAgICAgICAgICAgIH0pO1xyXG4gICAgICAgIHJldHVybiB0aGlzLmN1cnJlbnRUYXNrO1xyXG4gICAgfTtcclxuXHJcbiAgICBwdWJsaWMgY3JlYXRlRmxhdEdyb3Vwc0xpc3QgKGdyb3VwczogSUdyb3VwW10sIG5vdEluY2x1ZGVDaGlsZHJlbjogYm9vbGVhbiA9IGZhbHNlKTogSUdyb3VwW10ge1xyXG4gICAgICAgIGxldCBmb3VuZElkcyA9IFtdLFxyXG4gICAgICAgICAgICBncm91cHNUb0FkZCA9IFtdLFxyXG4gICAgICAgICAgICBtYWtlRmxhdFBhcmVudHMgPSAoaXRlbSkgPT4ge1xyXG4gICAgICAgICAgICAgICAgbGV0IGl0ZW1Db3B5ID0gVXRpbHMuZXh0ZW5kKHt9LCBpdGVtKTtcclxuICAgICAgICAgICAgICAgIGlmIChpdGVtICYmIGl0ZW0ucGFyZW50KSB7XHJcbiAgICAgICAgICAgICAgICAgICAgbWFrZUZsYXRQYXJlbnRzKGl0ZW0ucGFyZW50KTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIGl0ZW1Db3B5LmNoaWxkcmVuID0gaXRlbUNvcHkuY2hpbGRyZW4ubWFwKGNoaWxkID0+IGNoaWxkLmlkKTtcclxuICAgICAgICAgICAgICAgIGl0ZW1Db3B5LnBhcmVudCA9IGl0ZW0ucGFyZW50ID8ge2lkOiBpdGVtLnBhcmVudC5pZCwgbmFtZTogaXRlbS5wYXJlbnQubmFtZX0gOiBudWxsO1xyXG4gICAgICAgICAgICAgICAgaWYgKGZvdW5kSWRzLmluZGV4T2YoaXRlbS5pZCkgPT09IC0xKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgZ3JvdXBzVG9BZGQucHVzaChpdGVtQ29weSk7XHJcbiAgICAgICAgICAgICAgICAgICAgZm91bmRJZHMucHVzaChpdGVtLmlkKTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgbWFrZUZsYXRDaGlsZHJlbiA9IChpdGVtKSA9PiB7XHJcbiAgICAgICAgICAgICAgICBpZiAoaXRlbSAmJiBpdGVtLmNoaWxkcmVuICYmIGl0ZW0uY2hpbGRyZW4ubGVuZ3RoKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgaXRlbS5jaGlsZHJlbi5mb3JFYWNoKChjaGlsZCkgPT4ge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBsZXQgY2hpbGRDb3B5O1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoZm91bmRJZHMuaW5kZXhPZihjaGlsZC5pZCkgPT09IC0xKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBtYWtlRmxhdENoaWxkcmVuKGNoaWxkKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgICAgICBjaGlsZENvcHkgPSBVdGlscy5leHRlbmQoe30sIGNoaWxkKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgY2hpbGRDb3B5LmNoaWxkcmVuID0gY2hpbGRDb3B5LmNoaWxkcmVuLm1hcChjaGlsZElubmVyID0+IGNoaWxkSW5uZXIuaWQpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBjaGlsZENvcHkucGFyZW50ID0gY2hpbGRDb3B5LnBhcmVudCA/IHtpZDogY2hpbGRDb3B5LnBhcmVudC5pZCwgbmFtZTogY2hpbGRDb3B5LnBhcmVudC5uYW1lfSA6IG51bGw7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChmb3VuZElkcy5pbmRleE9mKGNoaWxkLmlkKSA9PT0gLTEpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGdyb3Vwc1RvQWRkLnB1c2goY2hpbGRDb3B5KTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGZvdW5kSWRzLnB1c2goY2hpbGQuaWQpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH07XHJcblxyXG4gICAgICAgIGdyb3Vwcy5mb3JFYWNoKG1ha2VGbGF0UGFyZW50cyk7XHJcbiAgICAgICAgIW5vdEluY2x1ZGVDaGlsZHJlbiAmJiBncm91cHMuZm9yRWFjaChtYWtlRmxhdENoaWxkcmVuKTtcclxuICAgICAgICByZXR1cm4gZ3JvdXBzVG9BZGQ7XHJcbiAgICB9O1xyXG5cclxuICAgIHB1YmxpYyBnZXRHcm91cHNEYXRhIChncm91cElkczogc3RyaW5nW10sIG5vdEluY2x1ZGVDaGlsZHJlbjogYm9vbGVhbiA9IGZhbHNlKTogSUdyb3VwW10ge1xyXG4gICAgICAgIGxldCB0cmVlR3JvdXBzID0gZ3JvdXBJZHMubWFwKGdyb3VwSWQgPT5cclxuICAgICAgICAgICAgdGhpcy5maW5kQ2hpbGQoZ3JvdXBJZCwge2lkOiBudWxsLCBjaGlsZHJlbjogdGhpcy50cmVlfSwgdHJ1ZSkgfHwgdGhpcy5nZXRQcml2YXRlR3JvdXBEYXRhKGdyb3VwSWQpXHJcbiAgICAgICAgKTtcclxuICAgICAgICByZXR1cm4gdGhpcy5jcmVhdGVGbGF0R3JvdXBzTGlzdCh0cmVlR3JvdXBzLCBub3RJbmNsdWRlQ2hpbGRyZW4pO1xyXG4gICAgfTtcclxuXHJcbiAgICBwdWJsaWMgZ2V0Q3VzdG9tR3JvdXBzRGF0YSAoZ3JvdXBJZHM6IHN0cmluZ1tdLCBhbGxHcm91cHM6IElHcm91cFtdKTogSUdyb3VwW10ge1xyXG4gICAgICAgIGxldCBncm91cHNUcmVlID0gdGhpcy5jcmVhdGVHcm91cHNUcmVlKGFsbEdyb3VwcyksXHJcbiAgICAgICAgICAgIHRyZWVHcm91cHMgPSBncm91cElkcy5tYXAoZ3JvdXBJZCA9PiBcclxuICAgICAgICAgICAgICAgIHRoaXMuZmluZENoaWxkKGdyb3VwSWQsIHtpZDogbnVsbCwgY2hpbGRyZW46IGdyb3Vwc1RyZWV9LCB0cnVlKSB8fCB0aGlzLmdldFByaXZhdGVHcm91cERhdGEoZ3JvdXBJZClcclxuICAgICAgICAgICAgKTtcclxuICAgICAgICByZXR1cm4gdGhpcy5jcmVhdGVGbGF0R3JvdXBzTGlzdCh0cmVlR3JvdXBzLCB0cnVlKTtcclxuICAgIH07XHJcblxyXG4gICAgcHVibGljIGdldFByaXZhdGVHcm91cHNVc2Vycyhncm91cHM6IElHcm91cFtdKSB7XHJcbiAgICAgICAgcmV0dXJuIGdyb3Vwcy5yZWR1Y2UoKHVzZXJzLCBncm91cCkgPT4ge1xyXG4gICAgICAgICAgICBncm91cC51c2VyICYmIGdyb3VwLnVzZXIubmFtZSAhPT0gdGhpcy5jdXJyZW50VXNlck5hbWUgJiYgdXNlcnMucHVzaChncm91cC51c2VyKTtcclxuICAgICAgICAgICAgcmV0dXJuIHVzZXJzO1xyXG4gICAgICAgIH0sIFtdKTtcclxuICAgIH07XHJcblxyXG4gICAgcHVibGljIHVubG9hZCAoKTogdm9pZCB7XHJcbiAgICAgICAgdGhpcy5hYm9ydEN1cnJlbnRUYXNrKCk7XHJcbiAgICB9O1xyXG59IiwiaW1wb3J0IHsgZW50aXR5VG9EaWN0aW9uYXJ5IH0gZnJvbSBcIi4vdXRpbHNcIjtcclxuXHJcbnR5cGUgVE1hcFByb3ZpZGVyVHlwZSA9IFwiZGVmYXVsdFwiIHwgXCJhZGRpdGlvbmFsXCIgfCBcImN1c3RvbVwiO1xyXG5cclxuZXhwb3J0IGludGVyZmFjZSBJTWlzY0RhdGEge1xyXG4gICAgbWFwUHJvdmlkZXI6IHtcclxuICAgICAgICB2YWx1ZTogc3RyaW5nO1xyXG4gICAgICAgIHR5cGU6IFRNYXBQcm92aWRlclR5cGU7XHJcbiAgICB9O1xyXG4gICAgY3VycmVudFVzZXI6IGFueTtcclxuICAgIGlzVW5zaWduZWRBZGRpbnNBbGxvd2VkOiBib29sZWFuO1xyXG4gICAgYWRkaW5zOiBzdHJpbmdbXTtcclxufVxyXG5cclxuZXhwb3J0IGNsYXNzIE1pc2NCdWlsZGVyIHtcclxuICAgIHByaXZhdGUgcmVhZG9ubHkgYXBpO1xyXG4gICAgcHJpdmF0ZSBjdXN0b21NYXBQcm92aWRlcnM7XHJcbiAgICBwcml2YXRlIGN1cnJlbnRUYXNrO1xyXG4gICAgcHJpdmF0ZSBjdXJyZW50VXNlcjtcclxuICAgIHByaXZhdGUgaXNVbnNpZ25lZEFkZGluc0FsbG93ZWQ7XHJcbiAgICBwcml2YXRlIGFkZGluczogc3RyaW5nW107XHJcbiAgICBwcml2YXRlIHJlYWRvbmx5IGRlZmF1bHRNYXBQcm92aWRlcnMgPSB7XHJcbiAgICAgICAgR29vZ2xlTWFwczogXCJHb29nbGUgTWFwc1wiLFxyXG4gICAgICAgIEhlcmU6IFwiSEVSRSBNYXBzXCIsXHJcbiAgICAgICAgTWFwQm94OiBcIk1hcEJveFwiXHJcbiAgICB9O1xyXG5cclxuICAgIHByaXZhdGUgYWJvcnRDdXJyZW50VGFzayAoKSB7XHJcbiAgICAgICAgdGhpcy5jdXJyZW50VGFzayAmJiB0aGlzLmN1cnJlbnRUYXNrLmFib3J0ICYmIHRoaXMuY3VycmVudFRhc2suYWJvcnQoKTtcclxuICAgICAgICB0aGlzLmN1cnJlbnRUYXNrID0gbnVsbDtcclxuICAgIH1cclxuXHJcbiAgICBwcml2YXRlIGdldEFsbG93ZWRBZGRpbnMgKGFsbEFkZGluczogc3RyaW5nW10pIHtcclxuICAgICAgICByZXR1cm4gYWxsQWRkaW5zLmZpbHRlcihhZGRpbiA9PiB7XHJcbiAgICAgICAgICAgIGxldCBhZGRpbkNvbmZpZyA9IEpTT04ucGFyc2UoYWRkaW4pO1xyXG4gICAgICAgICAgICByZXR1cm4gYWRkaW5Db25maWcgJiYgQXJyYXkuaXNBcnJheShhZGRpbkNvbmZpZy5pdGVtcykgJiYgYWRkaW5Db25maWcuaXRlbXMuZXZlcnkoaXRlbSA9PiB7XHJcbiAgICAgICAgICAgICAgICBsZXQgdXJsID0gaXRlbS51cmw7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gdXJsICYmIHVybC5pbmRleE9mKFwiXFwvXFwvXCIpID4gLTE7XHJcbiAgICAgICAgICAgIH0pO1xyXG4gICAgICAgIH0pO1xyXG4gICAgfVxyXG5cclxuICAgIHByaXZhdGUgaXNDdXJyZW50QWRkaW4gKGFkZGluOiBzdHJpbmcpIHtcclxuICAgICAgICByZXR1cm4gYWRkaW4uaW5kZXhPZihcIlJlZ2lzdHJhdGlvbiBjb25maWdcIikgPiAtMTtcclxuICAgIH1cclxuXHJcbiAgICBjb25zdHJ1Y3RvcihhcGkpIHtcclxuICAgICAgICB0aGlzLmFwaSA9IGFwaTtcclxuICAgIH1cclxuXHJcbiAgICBmZXRjaCAoKTogUHJvbWlzZTxJTWlzY0RhdGE+IHtcclxuICAgICAgICB0aGlzLmFib3J0Q3VycmVudFRhc2soKTtcclxuICAgICAgICB0aGlzLmN1cnJlbnRUYXNrID0gbmV3IFByb21pc2UoKHJlc29sdmUsIHJlamVjdCkgPT4ge1xyXG4gICAgICAgICAgICB0aGlzLmFwaS5nZXRTZXNzaW9uKChzZXNzaW9uRGF0YSkgPT4ge1xyXG4gICAgICAgICAgICAgICAgbGV0IHVzZXJOYW1lID0gc2Vzc2lvbkRhdGEudXNlck5hbWU7XHJcbiAgICAgICAgICAgICAgICB0aGlzLmFwaS5tdWx0aUNhbGwoW1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBbXCJHZXRcIiwge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdHlwZU5hbWU6IFwiVXNlclwiLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgc2VhcmNoOiB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgbmFtZTogdXNlck5hbWVcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICAgICAgfV0sXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIFtcIkdldFwiLCB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0eXBlTmFtZTogXCJTeXN0ZW1TZXR0aW5nc1wiXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIH1dXHJcbiAgICAgICAgICAgICAgICAgICAgXSwgcmVzb2x2ZSwgcmVqZWN0KTtcclxuICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgfSkudGhlbigocmVzdWx0KSA9PiB7XHJcbiAgICAgICAgICAgIGxldCBjdXJyZW50VXNlciA9IHJlc3VsdFswXVswXSB8fCByZXN1bHRbMF0sXHJcbiAgICAgICAgICAgICAgICBzeXN0ZW1TZXR0aW5ncyA9IHJlc3VsdFsxXVswXSB8fCByZXN1bHRbMV0sXHJcbiAgICAgICAgICAgICAgICB1c2VyTWFwUHJvdmlkZXJJZCA9IGN1cnJlbnRVc2VyLmRlZmF1bHRNYXBFbmdpbmUsXHJcbiAgICAgICAgICAgICAgICBkZWZhdWx0TWFwUHJvdmlkZXJJZCA9IHN5c3RlbVNldHRpbmdzLm1hcFByb3ZpZGVyLFxyXG4gICAgICAgICAgICAgICAgbWFwUHJvdmlkZXJJZCA9IHRoaXMuZ2V0TWFwUHJvdmlkZXJUeXBlKHVzZXJNYXBQcm92aWRlcklkKSA9PT0gXCJjdXN0b21cIiA/IHVzZXJNYXBQcm92aWRlcklkIDogZGVmYXVsdE1hcFByb3ZpZGVySWQ7XHJcbiAgICAgICAgICAgIHRoaXMuY3VycmVudFVzZXIgPSBjdXJyZW50VXNlcjtcclxuICAgICAgICAgICAgdGhpcy5jdXN0b21NYXBQcm92aWRlcnMgPSBlbnRpdHlUb0RpY3Rpb25hcnkoc3lzdGVtU2V0dGluZ3MuY3VzdG9tV2ViTWFwUHJvdmlkZXJMaXN0KTtcclxuICAgICAgICAgICAgdGhpcy5pc1Vuc2lnbmVkQWRkaW5zQWxsb3dlZCA9IHN5c3RlbVNldHRpbmdzLmFsbG93VW5zaWduZWRBZGRJbjtcclxuICAgICAgICAgICAgdGhpcy5hZGRpbnMgPSB0aGlzLmdldEFsbG93ZWRBZGRpbnMoc3lzdGVtU2V0dGluZ3MuY3VzdG9tZXJQYWdlcyk7XHJcbiAgICAgICAgICAgIHJldHVybiB7XHJcbiAgICAgICAgICAgICAgICBtYXBQcm92aWRlcjoge1xyXG4gICAgICAgICAgICAgICAgICAgIHZhbHVlOiBtYXBQcm92aWRlcklkLFxyXG4gICAgICAgICAgICAgICAgICAgIHR5cGU6IHRoaXMuZ2V0TWFwUHJvdmlkZXJUeXBlKG1hcFByb3ZpZGVySWQpXHJcbiAgICAgICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICAgICAgY3VycmVudFVzZXI6IHRoaXMuY3VycmVudFVzZXIsXHJcbiAgICAgICAgICAgICAgICBpc1Vuc2lnbmVkQWRkaW5zQWxsb3dlZDogdGhpcy5pc1Vuc2lnbmVkQWRkaW5zQWxsb3dlZCxcclxuICAgICAgICAgICAgICAgIGFkZGluczogdGhpcy5hZGRpbnNcclxuICAgICAgICAgICAgfTtcclxuICAgICAgICB9KTtcclxuICAgICAgICByZXR1cm4gdGhpcy5jdXJyZW50VGFzaztcclxuICAgIH1cclxuXHJcbiAgICBnZXRNYXBQcm92aWRlclR5cGUgKG1hcFByb3ZpZGVySWQ6IHN0cmluZyk6IFRNYXBQcm92aWRlclR5cGUge1xyXG4gICAgICAgIHJldHVybiB0aGlzLmRlZmF1bHRNYXBQcm92aWRlcnNbbWFwUHJvdmlkZXJJZF0gPyBcImRlZmF1bHRcIiA6IFwiY3VzdG9tXCI7XHJcbiAgICB9XHJcblxyXG4gICAgZ2V0TWFwUHJvdmlkZXJOYW1lIChtYXBQcm92aWRlcklkOiBzdHJpbmcpOiBzdHJpbmcge1xyXG4gICAgICAgIHJldHVybiBtYXBQcm92aWRlcklkICYmICh0aGlzLmRlZmF1bHRNYXBQcm92aWRlcnNbbWFwUHJvdmlkZXJJZF0gfHwgKHRoaXMuY3VzdG9tTWFwUHJvdmlkZXJzW21hcFByb3ZpZGVySWRdICYmIHRoaXMuY3VzdG9tTWFwUHJvdmlkZXJzW21hcFByb3ZpZGVySWRdLm5hbWUpIHx8IG1hcFByb3ZpZGVySWQpO1xyXG4gICAgfVxyXG5cclxuICAgIGdldE1hcFByb3ZpZGVyRGF0YSAobWFwUHJvdmlkZXJJZDogc3RyaW5nKSB7XHJcbiAgICAgICAgcmV0dXJuIG1hcFByb3ZpZGVySWQgJiYgdGhpcy5jdXN0b21NYXBQcm92aWRlcnNbbWFwUHJvdmlkZXJJZF07XHJcbiAgICB9XHJcblxyXG4gICAgaXNUaGlzQWRkaW5JbmNsdWRlZCAoKSB7XHJcbiAgICAgICAgcmV0dXJuIHRoaXMuYWRkaW5zLnNvbWUodGhpcy5pc0N1cnJlbnRBZGRpbik7XHJcbiAgICB9XHJcblxyXG4gICAgZ2V0QWRkaW5zRGF0YSAoaW5jbHVkZVRoaXNBZGRpbiA9IHRydWUpIHtcclxuICAgICAgICByZXR1cm4gIWluY2x1ZGVUaGlzQWRkaW4gPyB0aGlzLmFkZGlucy5maWx0ZXIoYWRkaW4gPT4gIXRoaXMuaXNDdXJyZW50QWRkaW4oYWRkaW4pKSA6IHRoaXMuYWRkaW5zO1xyXG4gICAgfVxyXG5cclxuICAgIHVubG9hZCAoKTogdm9pZCB7XHJcbiAgICAgICAgdGhpcy5hYm9ydEN1cnJlbnRUYXNrKCk7XHJcbiAgICB9XHJcbn0iLCIvLy8gPHJlZmVyZW5jZSBwYXRoPVwiLi4vYmx1ZWJpcmQuZC50c1wiLz5cclxuaW1wb3J0ICogYXMgVXRpbHMgZnJvbSBcIi4vdXRpbHNcIjtcclxuXHJcbmNvbnN0IFJFUE9SVF9UWVBFX0RBU0hCT0FEID0gXCJEYXNoYm9hcmRcIjtcclxuXHJcbmludGVyZmFjZSBJUmVwb3J0IHtcclxuICAgIGlkOiBzdHJpbmc7XHJcbiAgICBncm91cHM6IElHcm91cFtdO1xyXG4gICAgaW5jbHVkZUFsbENoaWxkcmVuR3JvdXBzOiBJR3JvdXBbXTtcclxuICAgIGluY2x1ZGVEaXJlY3RDaGlsZHJlbk9ubHlHcm91cHM6IElHcm91cFtdO1xyXG4gICAgc2NvcGVHcm91cHM6IElHcm91cFtdO1xyXG4gICAgZGVzdGluYXRpb24/OiBzdHJpbmc7XHJcbiAgICB0ZW1wbGF0ZTogSVJlcG9ydFRlbXBsYXRlO1xyXG4gICAgbGFzdE1vZGlmaWVkVXNlcjtcclxuICAgIGFyZ3VtZW50czoge1xyXG4gICAgICAgIHJ1bGVzPzogYW55W107XHJcbiAgICAgICAgZGV2aWNlcz86IGFueVtdO1xyXG4gICAgICAgIHpvbmVUeXBlTGlzdD86IGFueVtdO1xyXG4gICAgICAgIFtwcm9wTmFtZTogc3RyaW5nXTogYW55O1xyXG4gICAgfTtcclxuICAgIFtwcm9wTmFtZTogc3RyaW5nXTogYW55O1xyXG59XHJcblxyXG5pbnRlcmZhY2UgSUdyb3VwIHtcclxuICAgIGlkOiBzdHJpbmc7XHJcbiAgICBjaGlsZHJlbjogSUdyb3VwW107XHJcbn1cclxuXHJcbmV4cG9ydCBpbnRlcmZhY2UgSVJlcG9ydERlcGVuZGVuY2llcyB7XHJcbiAgICBkZXZpY2VzPzogc3RyaW5nW107XHJcbiAgICBydWxlcz86IHN0cmluZ1tdO1xyXG4gICAgem9uZVR5cGVzPzogc3RyaW5nW107XHJcbiAgICBncm91cHM/OiBzdHJpbmdbXTtcclxufVxyXG5cclxuaW50ZXJmYWNlIElSZXBvcnRUZW1wbGF0ZSB7XHJcbiAgICBpZDogc3RyaW5nO1xyXG4gICAgbmFtZTogc3RyaW5nO1xyXG4gICAgaXNTeXN0ZW06IGJvb2xlYW47XHJcbiAgICByZXBvcnREYXRhU291cmNlOiBzdHJpbmc7XHJcbiAgICByZXBvcnRUZW1wbGF0ZVR5cGU6IHN0cmluZztcclxuICAgIHJlcG9ydHM6IElSZXBvcnRbXTtcclxuICAgIGJpbmFyeURhdGE/OiBzdHJpbmc7XHJcbiAgICBbcHJvcE5hbWU6IHN0cmluZ106IGFueTtcclxufVxyXG5cclxuZXhwb3J0IGRlZmF1bHQgY2xhc3MgUmVwb3J0c0J1aWxkZXIge1xyXG4gICAgcHJpdmF0ZSByZWFkb25seSBhcGk7XHJcbiAgICBwcml2YXRlIGN1cnJlbnRUYXNrO1xyXG4gICAgcHJpdmF0ZSBhbGxSZXBvcnRzOiBJUmVwb3J0W107XHJcbiAgICBwcml2YXRlIHN0cnVjdHVyZWRSZXBvcnRzO1xyXG4gICAgcHJpdmF0ZSBkYXNoYm9hcmRzTGVuZ3RoOiBudW1iZXI7XHJcbiAgICBwcml2YXRlIGFsbFRlbXBsYXRlczogSVJlcG9ydFRlbXBsYXRlW107XHJcblxyXG4gICAgcHJpdmF0ZSBnZXRSZXBvcnRzICgpOiBQcm9taXNlPGFueT4ge1xyXG4gICAgICAgIHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XHJcbiAgICAgICAgICAgIHRoaXMuYXBpLm11bHRpQ2FsbChbXHJcbiAgICAgICAgICAgICAgICBbXCJHZXRSZXBvcnRTY2hlZHVsZXNcIiwge1xyXG4gICAgICAgICAgICAgICAgICAgIFwiaW5jbHVkZVRlbXBsYXRlRGV0YWlsc1wiOiB0cnVlLFxyXG4gICAgICAgICAgICAgICAgICAgIFwiYXBwbHlVc2VyRmlsdGVyXCI6IGZhbHNlXHJcbiAgICAgICAgICAgICAgICB9XSxcclxuICAgICAgICAgICAgICAgIFtcIkdldFwiLCB7XHJcbiAgICAgICAgICAgICAgICAgICAgXCJ0eXBlTmFtZVwiOiBcIlJlcG9ydFRlbXBsYXRlXCIsXHJcbiAgICAgICAgICAgICAgICAgICAgXCJzZWFyY2hcIjoge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBpbmNsdWRlQmluYXJ5RGF0YTogZmFsc2VcclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICB9XSxcclxuICAgICAgICAgICAgICAgIFtcIkdldERhc2hib2FyZEl0ZW1zXCIsIHt9XVxyXG4gICAgICAgICAgICBdLCByZXNvbHZlLCByZWplY3QpO1xyXG4gICAgICAgIH0pO1xyXG4gICAgfVxyXG5cclxuICAgIHByaXZhdGUgc3RydWN0dXJlUmVwb3J0cyAocmVwb3J0cywgdGVtcGxhdGVzKSB7XHJcbiAgICAgICAgbGV0IGZpbmRUZW1wbGF0ZVJlcG9ydHMgPSAodGVtcGxhdGVJZCkgPT4ge1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIHJlcG9ydHMuZmlsdGVyKHJlcG9ydCA9PiByZXBvcnQudGVtcGxhdGUuaWQgPT09IHRlbXBsYXRlSWQpO1xyXG4gICAgICAgICAgICB9O1xyXG4gICAgICAgIHJldHVybiB0ZW1wbGF0ZXMucmVkdWNlKChyZXMsIHRlbXBsYXRlKSA9PiB7XHJcbiAgICAgICAgICAgIGxldCB0ZW1wbGF0ZUlkID0gdGVtcGxhdGUuaWQsXHJcbiAgICAgICAgICAgICAgICB0ZW1wbGF0ZVJlcG9ydHMgPSBmaW5kVGVtcGxhdGVSZXBvcnRzKHRlbXBsYXRlSWQpO1xyXG4gICAgICAgICAgICBpZiAodGVtcGxhdGVSZXBvcnRzLmxlbmd0aCkge1xyXG4gICAgICAgICAgICAgICAgdGVtcGxhdGUucmVwb3J0cyA9IHRlbXBsYXRlUmVwb3J0cztcclxuICAgICAgICAgICAgICAgIHJlcy5wdXNoKHRlbXBsYXRlKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICByZXR1cm4gcmVzO1xyXG4gICAgICAgIH0sIFtdKTtcclxuICAgIH1cclxuXHJcbiAgICBwcml2YXRlIGFib3J0Q3VycmVudFRhc2sgKCk6IHZvaWQge1xyXG4gICAgICAgIHRoaXMuY3VycmVudFRhc2sgJiYgdGhpcy5jdXJyZW50VGFzay5hYm9ydCAmJiB0aGlzLmN1cnJlbnRUYXNrLmFib3J0KCk7XHJcbiAgICAgICAgdGhpcy5jdXJyZW50VGFzayA9IG51bGw7XHJcbiAgICB9XHJcblxyXG4gICAgcHJpdmF0ZSB1cGRhdGVUZW1wbGF0ZSAobmV3VGVtcGxhdGVEYXRhOiBJUmVwb3J0VGVtcGxhdGUpIHtcclxuICAgICAgICB0aGlzLmFsbFRlbXBsYXRlcy5zb21lKCh0ZW1wbGF0ZURhdGE6IElSZXBvcnRUZW1wbGF0ZSwgaW5kZXg6IG51bWJlcikgPT4ge1xyXG4gICAgICAgICAgICBpZiAodGVtcGxhdGVEYXRhLmlkID09PSBuZXdUZW1wbGF0ZURhdGEuaWQpIHtcclxuICAgICAgICAgICAgICAgIHRoaXMuYWxsVGVtcGxhdGVzW2luZGV4XSA9IG5ld1RlbXBsYXRlRGF0YTtcclxuICAgICAgICAgICAgICAgIHJldHVybiB0cnVlO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIHJldHVybiBmYWxzZTtcclxuICAgICAgICB9KTtcclxuICAgIH1cclxuXHJcbiAgICBjb25zdHJ1Y3RvcihhcGkpIHtcclxuICAgICAgICB0aGlzLmFwaSA9IGFwaTtcclxuICAgIH1cclxuXHJcbiAgICBwdWJsaWMgZmV0Y2ggKCk6IFByb21pc2U8YW55PiB7XHJcbiAgICAgICAgdGhpcy5hYm9ydEN1cnJlbnRUYXNrKCk7XHJcbiAgICAgICAgdGhpcy5jdXJyZW50VGFzayA9IHRoaXMuZ2V0UmVwb3J0cygpXHJcbiAgICAgICAgICAgIC50aGVuKChbcmVwb3J0cywgdGVtcGxhdGVzLCBkYXNoYm9hcmRJdGVtc10pID0+IHtcclxuICAgICAgICAgICAgICAgIHRoaXMuYWxsUmVwb3J0cyA9IHJlcG9ydHM7XHJcbiAgICAgICAgICAgICAgICB0aGlzLmFsbFRlbXBsYXRlcyA9IHRlbXBsYXRlcztcclxuICAgICAgICAgICAgICAgIHRoaXMuZGFzaGJvYXJkc0xlbmd0aCA9IGRhc2hib2FyZEl0ZW1zICYmIGRhc2hib2FyZEl0ZW1zLmxlbmd0aCA/IGRhc2hib2FyZEl0ZW1zLmxlbmd0aCA6IDA7XHJcbiAgICAgICAgICAgICAgICB0aGlzLnN0cnVjdHVyZWRSZXBvcnRzID0gdGhpcy5zdHJ1Y3R1cmVSZXBvcnRzKHJlcG9ydHMsIHRlbXBsYXRlcyk7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gdGhpcy5zdHJ1Y3R1cmVkUmVwb3J0cztcclxuICAgICAgICAgICAgfSlcclxuICAgICAgICAgICAgLmNhdGNoKGNvbnNvbGUuZXJyb3IpXHJcbiAgICAgICAgICAgIC5maW5hbGx5KCgpID0+IHtcclxuICAgICAgICAgICAgICAgIHRoaXMuY3VycmVudFRhc2sgPSBudWxsO1xyXG4gICAgICAgICAgICB9KTtcclxuICAgICAgICByZXR1cm4gdGhpcy5jdXJyZW50VGFzaztcclxuICAgIH1cclxuXHJcbiAgICBwdWJsaWMgZ2V0RGVwZW5kZW5jaWVzIChyZXBvcnRzOiBJUmVwb3J0VGVtcGxhdGVbXSk6IElSZXBvcnREZXBlbmRlbmNpZXMge1xyXG4gICAgICAgIGxldCBhbGxEZXBlbmRlbmNpZXM6IElSZXBvcnREZXBlbmRlbmNpZXMgPSB7XHJcbiAgICAgICAgICAgICAgICBkZXZpY2VzOiBbXSxcclxuICAgICAgICAgICAgICAgIHJ1bGVzOiBbXSxcclxuICAgICAgICAgICAgICAgIHpvbmVUeXBlczogW10sXHJcbiAgICAgICAgICAgICAgICBncm91cHM6IFtdXHJcbiAgICAgICAgICAgIH07XHJcbiAgICAgICAgcmV0dXJuIHJlcG9ydHMucmVkdWNlKChyZXBvcnRzRGVwZW5kZW5jaWVzOiBJUmVwb3J0RGVwZW5kZW5jaWVzLCB0ZW1wbGF0ZTogSVJlcG9ydFRlbXBsYXRlKSA9PiB7XHJcbiAgICAgICAgICAgIHJldHVybiB0ZW1wbGF0ZS5yZXBvcnRzLnJlZHVjZSgodGVtcGxhdGVEZXBlbmRlY2llcywgcmVwb3J0KSA9PiB7XHJcbiAgICAgICAgICAgICAgICB0ZW1wbGF0ZURlcGVuZGVjaWVzLmdyb3VwcyA9IFV0aWxzLm1lcmdlVW5pcXVlKHRlbXBsYXRlRGVwZW5kZWNpZXMuZ3JvdXBzLCBVdGlscy5nZXRFbnRpdGllc0lkcyhyZXBvcnQuZ3JvdXBzKSxcclxuICAgICAgICAgICAgICAgICAgICBVdGlscy5nZXRFbnRpdGllc0lkcyhyZXBvcnQuaW5jbHVkZUFsbENoaWxkcmVuR3JvdXBzKSwgVXRpbHMuZ2V0RW50aXRpZXNJZHMocmVwb3J0LmluY2x1ZGVEaXJlY3RDaGlsZHJlbk9ubHlHcm91cHMpLFxyXG4gICAgICAgICAgICAgICAgICAgIFV0aWxzLmdldEVudGl0aWVzSWRzKHJlcG9ydC5zY29wZUdyb3VwcykpO1xyXG4gICAgICAgICAgICAgICAgdGVtcGxhdGVEZXBlbmRlY2llcy5kZXZpY2VzID0gVXRpbHMubWVyZ2VVbmlxdWUodGVtcGxhdGVEZXBlbmRlY2llcy5kZXZpY2VzLCByZXBvcnQuYXJndW1lbnRzICYmIHJlcG9ydC5hcmd1bWVudHMuZGV2aWNlcyAmJiBVdGlscy5nZXRFbnRpdGllc0lkcyhyZXBvcnQuYXJndW1lbnRzLmRldmljZXMpIHx8IFtdKTtcclxuICAgICAgICAgICAgICAgIHRlbXBsYXRlRGVwZW5kZWNpZXMucnVsZXMgPSBVdGlscy5tZXJnZVVuaXF1ZSh0ZW1wbGF0ZURlcGVuZGVjaWVzLnJ1bGVzLCByZXBvcnQuYXJndW1lbnRzICYmIHJlcG9ydC5hcmd1bWVudHMucnVsZXMgJiYgVXRpbHMuZ2V0RW50aXRpZXNJZHMocmVwb3J0LmFyZ3VtZW50cy5ydWxlcykgfHwgW10pO1xyXG4gICAgICAgICAgICAgICAgdGVtcGxhdGVEZXBlbmRlY2llcy56b25lVHlwZXMgPSBVdGlscy5tZXJnZVVuaXF1ZShcclxuICAgICAgICAgICAgICAgICAgICB0ZW1wbGF0ZURlcGVuZGVjaWVzLnpvbmVUeXBlcywgcmVwb3J0LmFyZ3VtZW50cyAmJiByZXBvcnQuYXJndW1lbnRzLnpvbmVUeXBlTGlzdCAmJiBVdGlscy5nZXRFbnRpdGllc0lkcyhyZXBvcnQuYXJndW1lbnRzLnpvbmVUeXBlTGlzdCkgfHwgW10pO1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIHRlbXBsYXRlRGVwZW5kZWNpZXM7XHJcbiAgICAgICAgICAgIH0sIHJlcG9ydHNEZXBlbmRlbmNpZXMpO1xyXG4gICAgICAgIH0sIGFsbERlcGVuZGVuY2llcyk7XHJcbiAgICB9XHJcblxyXG4gICAgcHVibGljIGdldERhdGEgKCk6IFByb21pc2U8SVJlcG9ydFRlbXBsYXRlW10+IHtcclxuICAgICAgICBsZXQgcG9ydGlvblNpemUgPSAxNSxcclxuICAgICAgICAgICAgcG9ydGlvbnMgPSB0aGlzLmFsbFRlbXBsYXRlcy5yZWR1Y2UoKHJlcXVlc3RzLCB0ZW1wbGF0ZTogSVJlcG9ydFRlbXBsYXRlKSA9PiB7XHJcbiAgICAgICAgICAgICAgICBpZiAoIXRlbXBsYXRlLmlzU3lzdGVtICYmICF0ZW1wbGF0ZS5iaW5hcnlEYXRhKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgbGV0IHBvcnRpb25JbmRleDogbnVtYmVyID0gcmVxdWVzdHMubGVuZ3RoIC0gMTtcclxuICAgICAgICAgICAgICAgICAgICBpZiAoIXJlcXVlc3RzW3BvcnRpb25JbmRleF0gfHwgcmVxdWVzdHNbcG9ydGlvbkluZGV4XS5sZW5ndGggPj0gcG9ydGlvblNpemUpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICByZXF1ZXN0cy5wdXNoKFtdKTtcclxuICAgICAgICAgICAgICAgICAgICAgICBwb3J0aW9uSW5kZXggKys7XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgIHJlcXVlc3RzW3BvcnRpb25JbmRleF0ucHVzaChbXCJHZXRcIiwge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBcInR5cGVOYW1lXCI6IFwiUmVwb3J0VGVtcGxhdGVcIixcclxuICAgICAgICAgICAgICAgICAgICAgICAgXCJzZWFyY2hcIjoge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaWQ6IHRlbXBsYXRlLmlkLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaW5jbHVkZUJpbmFyeURhdGE6IHRydWVcclxuICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgIH1dKTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIHJldHVybiByZXF1ZXN0cztcclxuICAgICAgICAgICAgfSwgW10pLFxyXG4gICAgICAgICAgICB0b3RhbFJlc3VsdHM6IGFueVtdW10gPSBbXSxcclxuICAgICAgICAgICAgZ2V0UG9ydGlvbkRhdGEgPSBwb3J0aW9uID0+IHtcclxuICAgICAgICAgICAgICAgIHJldHVybiBuZXcgUHJvbWlzZTxhbnk+KChyZXNvbHZlLCByZWplY3QpID0+IHtcclxuICAgICAgICAgICAgICAgICAgICB0aGlzLmFwaS5tdWx0aUNhbGwocG9ydGlvbiwgcmVzb2x2ZSwgcmVqZWN0KTtcclxuICAgICAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICBlcnJvclBvcnRpb25zID0gW107XHJcblxyXG4gICAgICAgIHRoaXMuYWJvcnRDdXJyZW50VGFzaygpO1xyXG4gICAgICAgIHRoaXMuY3VycmVudFRhc2sgPSBwb3J0aW9ucy5yZWR1Y2UoKHByb21pc2VzLCBwb3J0aW9uKSA9PiB7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gcHJvbWlzZXNcclxuICAgICAgICAgICAgICAgICAgICAudGhlbigoKSA9PiBnZXRQb3J0aW9uRGF0YShwb3J0aW9uKSlcclxuICAgICAgICAgICAgICAgICAgICAudGhlbihyZXN1bHQgPT4ge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdG90YWxSZXN1bHRzID0gdG90YWxSZXN1bHRzLmNvbmNhdChyZXN1bHQpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB9LCBlID0+IHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGVycm9yUG9ydGlvbnMgPSBlcnJvclBvcnRpb25zLmNvbmNhdChwb3J0aW9uKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoZSk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICApO1xyXG4gICAgICAgICAgICB9LCBVdGlscy5yZXNvbHZlZFByb21pc2UoW10pKVxyXG4gICAgICAgICAgICAudGhlbigoKSA9PiB7XHJcbiAgICAgICAgICAgICAgICBlcnJvclBvcnRpb25zLmxlbmd0aCAmJiBjb25zb2xlLndhcm4oZXJyb3JQb3J0aW9ucyk7XHJcbiAgICAgICAgICAgICAgICB0b3RhbFJlc3VsdHMuZm9yRWFjaCh0ZW1wbGF0ZURhdGEgPT4ge1xyXG4gICAgICAgICAgICAgICAgICAgIGxldCB0ZW1wbGF0ZTogSVJlcG9ydFRlbXBsYXRlID0gdGVtcGxhdGVEYXRhLmxlbmd0aCA/IHRlbXBsYXRlRGF0YVswXSA6IHRlbXBsYXRlRGF0YTtcclxuICAgICAgICAgICAgICAgICAgICB0aGlzLnVwZGF0ZVRlbXBsYXRlKHRlbXBsYXRlKTtcclxuICAgICAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgICAgICAgdGhpcy5zdHJ1Y3R1cmVkUmVwb3J0cyA9IHRoaXMuc3RydWN0dXJlUmVwb3J0cyh0aGlzLmFsbFJlcG9ydHMsIHRoaXMuYWxsVGVtcGxhdGVzKTtcclxuICAgICAgICAgICAgICAgIHJldHVybiB0aGlzLnN0cnVjdHVyZWRSZXBvcnRzO1xyXG4gICAgICAgICAgICB9KVxyXG4gICAgICAgICAgICAuY2F0Y2goY29uc29sZS5lcnJvcilcclxuICAgICAgICAgICAgLmZpbmFsbHkoKCkgPT4ge1xyXG4gICAgICAgICAgICAgICAgdGhpcy5jdXJyZW50VGFzayA9IG51bGw7XHJcbiAgICAgICAgICAgIH0pO1xyXG4gICAgICAgIHJldHVybiB0aGlzLmN1cnJlbnRUYXNrO1xyXG4gICAgfVxyXG5cclxuICAgIHB1YmxpYyBnZXREYXNoYm9hcmRzUXR5ICgpOiBudW1iZXIge1xyXG4gICAgICAgIHJldHVybiB0aGlzLmRhc2hib2FyZHNMZW5ndGg7XHJcbiAgICB9XHJcblxyXG4gICAgcHVibGljIGdldEN1c3RvbWl6ZWRSZXBvcnRzUXR5ICgpOiBudW1iZXIge1xyXG4gICAgICAgIGxldCB0ZW1wbGF0ZXMgPSBbXTtcclxuICAgICAgICByZXR1cm4gKHRoaXMuYWxsUmVwb3J0cy5maWx0ZXIoKHJlcG9ydDogSVJlcG9ydCkgPT4ge1xyXG4gICAgICAgICAgICBsZXQgdGVtcGxhdGVJZCA9IHJlcG9ydC50ZW1wbGF0ZS5pZCxcclxuICAgICAgICAgICAgICAgIHRlbXBsYXRlRXhpc3RzOiBib29sZWFuID0gdGVtcGxhdGVzLmluZGV4T2YodGVtcGxhdGVJZCkgPiAtMSxcclxuICAgICAgICAgICAgICAgIGlzQ291bnQ6IGJvb2xlYW4gPSAhdGVtcGxhdGVFeGlzdHMgJiYgcmVwb3J0Lmxhc3RNb2RpZmllZFVzZXIgIT09IFwiTm9Vc2VySWRcIjtcclxuICAgICAgICAgICAgaXNDb3VudCAmJiB0ZW1wbGF0ZXMucHVzaCh0ZW1wbGF0ZUlkKTtcclxuICAgICAgICAgICAgcmV0dXJuIGlzQ291bnQ7XHJcbiAgICAgICAgfSkpLmxlbmd0aDtcclxuICAgIH1cclxuXHJcbiAgICBwdWJsaWMgdW5sb2FkICgpOiB2b2lkIHtcclxuICAgICAgICB0aGlzLmFib3J0Q3VycmVudFRhc2soKTtcclxuICAgIH1cclxufSIsIi8vLyA8cmVmZXJlbmNlIHBhdGg9XCIuLi9ibHVlYmlyZC5kLnRzXCIvPlxyXG5pbXBvcnQgeyBzb3J0QXJyYXlPZkVudGl0aWVzLCBlbnRpdHlUb0RpY3Rpb25hcnksIG1lcmdlVW5pcXVlIH0gZnJvbSBcIi4vdXRpbHNcIjtcclxuXHJcbmludGVyZmFjZSBJUnVsZSB7XHJcbiAgICBpZDogc3RyaW5nO1xyXG4gICAgZ3JvdXBzOiBhbnlbXTtcclxuICAgIGNvbmRpdGlvbjogYW55O1xyXG59XHJcblxyXG5leHBvcnQgaW50ZXJmYWNlIElSdWxlRGVwZW5kZW5jaWVzIHtcclxuICAgIGRldmljZXM/OiBhbnlbXTtcclxuICAgIHVzZXJzPzogYW55W107XHJcbiAgICB6b25lcz86IGFueVtdO1xyXG4gICAgem9uZVR5cGVzPzogYW55W107XHJcbiAgICB3b3JrVGltZXM/OiBhbnlbXTtcclxuICAgIHdvcmtIb2xpZGF5cz86IGFueVtdO1xyXG4gICAgZ3JvdXBzPzogYW55W107XHJcbiAgICBzZWN1cml0eUdyb3Vwcz86IGFueVtdO1xyXG4gICAgZGlhZ25vc3RpY3M/OiBhbnlbXTtcclxufVxyXG5cclxuY29uc3QgQVBQTElDQVRJT05fUlVMRV9JRCA9IFwiUnVsZUFwcGxpY2F0aW9uRXhjZXB0aW9uSWRcIjtcclxuXHJcbmV4cG9ydCBkZWZhdWx0IGNsYXNzIFJ1bGVzQnVpbGRlciB7XHJcbiAgICBwcml2YXRlIHJlYWRvbmx5IGFwaTtcclxuICAgIHByaXZhdGUgY3VycmVudFRhc2s7XHJcbiAgICBwcml2YXRlIGNvbWJpbmVkUnVsZXM7XHJcbiAgICBwcml2YXRlIHN0cnVjdHVyZWRSdWxlcztcclxuXHJcbiAgICBwcml2YXRlIGdldFJ1bGVzICgpOiBQcm9taXNlPGFueT4ge1xyXG4gICAgICAgIHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XHJcbiAgICAgICAgICAgIHRoaXMuYXBpLmNhbGwoXCJHZXRcIiwge1xyXG4gICAgICAgICAgICAgICAgXCJ0eXBlTmFtZVwiOiBcIlJ1bGVcIlxyXG4gICAgICAgICAgICB9LCByZXNvbHZlLCByZWplY3QpO1xyXG4gICAgICAgIH0pO1xyXG4gICAgfVxyXG5cclxuICAgIHByaXZhdGUgc3RydWN0dXJlUnVsZXMgKHJ1bGVzKSB7XHJcbiAgICAgICAgcmV0dXJuIHNvcnRBcnJheU9mRW50aXRpZXMocnVsZXMsIFtbXCJiYXNlVHlwZVwiLCBcImRlc2NcIl0sIFwibmFtZVwiXSk7XHJcbiAgICB9XHJcblxyXG4gICAgcHJpdmF0ZSBhYm9ydEN1cnJlbnRUYXNrICgpOiB2b2lkIHtcclxuICAgICAgICB0aGlzLmN1cnJlbnRUYXNrICYmIHRoaXMuY3VycmVudFRhc2suYWJvcnQgJiYgdGhpcy5jdXJyZW50VGFzay5hYm9ydCgpO1xyXG4gICAgICAgIHRoaXMuY3VycmVudFRhc2sgPSBudWxsO1xyXG4gICAgfVxyXG5cclxuICAgIGNvbnN0cnVjdG9yKGFwaSkge1xyXG4gICAgICAgIHRoaXMuYXBpID0gYXBpO1xyXG4gICAgfVxyXG5cclxuICAgIHB1YmxpYyBnZXREZXBlbmRlbmNpZXMgKHJ1bGVzKTogSVJ1bGVEZXBlbmRlbmNpZXMge1xyXG4gICAgICAgIGxldCBkZXBlbmRlbmNpZXMgPSB7XHJcbiAgICAgICAgICAgICAgICBkZXZpY2VzOiBbXSxcclxuICAgICAgICAgICAgICAgIHVzZXJzOiBbXSxcclxuICAgICAgICAgICAgICAgIHpvbmVzOiBbXSxcclxuICAgICAgICAgICAgICAgIHpvbmVUeXBlczogW10sXHJcbiAgICAgICAgICAgICAgICB3b3JrVGltZXM6IFtdLFxyXG4gICAgICAgICAgICAgICAgZ3JvdXBzOiBbXSxcclxuICAgICAgICAgICAgICAgIGRpYWdub3N0aWNzOiBbXVxyXG4gICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICBwcm9jZXNzRGVwZW5kZW5jaWVzID0gKGNvbmRpdGlvbikgPT4ge1xyXG4gICAgICAgICAgICAgICAgbGV0IGlkLCB0eXBlOiBzdHJpbmc7XHJcbiAgICAgICAgICAgICAgICBzd2l0Y2ggKGNvbmRpdGlvbi5jb25kaXRpb25UeXBlKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgY2FzZSBcIlJ1bGVXb3JrSG91cnNcIjpcclxuICAgICAgICAgICAgICAgICAgICBjYXNlIFwiQWZ0ZXJSdWxlV29ya0hvdXJzXCI6XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGlkID0gKGNvbmRpdGlvbi53b3JrVGltZSAmJiBjb25kaXRpb24ud29ya1RpbWUuaWQpIHx8IGNvbmRpdGlvbi53b3JrVGltZTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgdHlwZSA9IFwid29ya1RpbWVzXCI7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgICAgICAgICAgICAgIGNhc2UgXCJEcml2ZXJcIjpcclxuICAgICAgICAgICAgICAgICAgICAgICAgaWQgPSBjb25kaXRpb24uZHJpdmVyICYmIGNvbmRpdGlvbi5kcml2ZXIuaWQ7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHR5cGUgPSBcInVzZXJzXCI7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgICAgICAgICAgICAgIGNhc2UgXCJEZXZpY2VcIjpcclxuICAgICAgICAgICAgICAgICAgICAgICAgaWQgPSBjb25kaXRpb24uZGV2aWNlICYmIGNvbmRpdGlvbi5kZXZpY2UuaWQ7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHR5cGUgPSBcImRldmljZXNcIjtcclxuICAgICAgICAgICAgICAgICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgICAgICAgICAgICAgY2FzZSBcIkVudGVyaW5nQXJlYVwiOlxyXG4gICAgICAgICAgICAgICAgICAgIGNhc2UgXCJFeGl0aW5nQXJlYVwiOlxyXG4gICAgICAgICAgICAgICAgICAgIGNhc2UgXCJPdXRzaWRlQXJlYVwiOlxyXG4gICAgICAgICAgICAgICAgICAgIGNhc2UgXCJJbnNpZGVBcmVhXCI6XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChjb25kaXRpb24uem9uZSkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaWQgPSBjb25kaXRpb24uem9uZS5pZCB8fCBjb25kaXRpb24uem9uZTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHR5cGUgPSBcInpvbmVzXCI7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZCA9IGNvbmRpdGlvbi56b25lVHlwZS5pZDtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHR5cGUgPSBcInpvbmVUeXBlc1wiO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgICAgICAgICAgICAgIGNhc2UgXCJGaWx0ZXJTdGF0dXNEYXRhQnlEaWFnbm9zdGljXCI6XHJcbiAgICAgICAgICAgICAgICAgICAgY2FzZSBcIkFjdGl2ZU9ySW5hY3RpdmVGYXVsdFwiOlxyXG4gICAgICAgICAgICAgICAgICAgIGNhc2UgXCJGYXVsdFwiOlxyXG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoY29uZGl0aW9uLmRpYWdub3N0aWMpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlkID0gY29uZGl0aW9uLmRpYWdub3N0aWMuaWQgfHwgY29uZGl0aW9uLmRpYWdub3N0aWM7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0eXBlID0gXCJkaWFnbm9zdGljc1wiO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgICAgICAgICAgICAgIGRlZmF1bHQ6XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgaWQgJiYgdHlwZSAmJiBkZXBlbmRlbmNpZXNbdHlwZV0uaW5kZXhPZihpZCkgPT09IC0xICYmIGRlcGVuZGVuY2llc1t0eXBlXS5wdXNoKGlkKTtcclxuICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgY2hlY2tDb25kaXRpb25zID0gKHBhcmVudENvbmRpdGlvbiwgZGVwZW5kZW5jaWVzOiBJUnVsZURlcGVuZGVuY2llcyk6IElSdWxlRGVwZW5kZW5jaWVzID0+IHtcclxuICAgICAgICAgICAgICAgIGxldCBjb25kaXRpb25zID0gcGFyZW50Q29uZGl0aW9uLmNoaWxkcmVuIHx8IFtdO1xyXG4gICAgICAgICAgICAgICAgcHJvY2Vzc0RlcGVuZGVuY2llcyhwYXJlbnRDb25kaXRpb24pO1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIGNvbmRpdGlvbnMucmVkdWNlKChkZXBlbmRlbmNpZXMsIGNvbmRpdGlvbikgPT4ge1xyXG4gICAgICAgICAgICAgICAgICAgIGlmIChjb25kaXRpb24uY2hpbGRyZW4pIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgZGVwZW5kZW5jaWVzID0gY2hlY2tDb25kaXRpb25zKGNvbmRpdGlvbiwgZGVwZW5kZW5jaWVzKTtcclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgcHJvY2Vzc0RlcGVuZGVuY2llcyhjb25kaXRpb24pO1xyXG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBkZXBlbmRlbmNpZXM7XHJcbiAgICAgICAgICAgICAgICB9LCBkZXBlbmRlbmNpZXMpO1xyXG4gICAgICAgICAgICB9O1xyXG4gICAgICAgIHJldHVybiBydWxlcy5yZWR1Y2UoKGRlcGVuZGVuY2llczogSVJ1bGVEZXBlbmRlbmNpZXMsIHJ1bGU6IElSdWxlKSA9PiB7XHJcbiAgICAgICAgICAgIGRlcGVuZGVuY2llcy5ncm91cHMgPSBtZXJnZVVuaXF1ZShkZXBlbmRlbmNpZXMuZ3JvdXBzLCBydWxlLmdyb3Vwcy5tYXAoZ3JvdXAgPT4gZ3JvdXAuaWQpKTtcclxuICAgICAgICAgICAgaWYgKHJ1bGUuY29uZGl0aW9uKSB7XHJcbiAgICAgICAgICAgICAgICBkZXBlbmRlbmNpZXMgPSBjaGVja0NvbmRpdGlvbnMocnVsZS5jb25kaXRpb24sIGRlcGVuZGVuY2llcyk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgcmV0dXJuIGRlcGVuZGVuY2llcztcclxuICAgICAgICB9LCBkZXBlbmRlbmNpZXMpO1xyXG4gICAgfVxyXG5cclxuICAgIHB1YmxpYyBmZXRjaCgpOiBQcm9taXNlPGFueT4ge1xyXG4gICAgICAgIHRoaXMuYWJvcnRDdXJyZW50VGFzaygpO1xyXG4gICAgICAgIHRoaXMuY3VycmVudFRhc2sgPSB0aGlzLmdldFJ1bGVzKClcclxuICAgICAgICAgICAgLnRoZW4oKHN3aXRjaGVkT25SdWxlcykgPT4ge1xyXG4gICAgICAgICAgICAgICAgdGhpcy5jb21iaW5lZFJ1bGVzID0gZW50aXR5VG9EaWN0aW9uYXJ5KHN3aXRjaGVkT25SdWxlcyk7XHJcbiAgICAgICAgICAgICAgICBkZWxldGUodGhpcy5jb21iaW5lZFJ1bGVzW0FQUExJQ0FUSU9OX1JVTEVfSURdKTtcclxuICAgICAgICAgICAgICAgIHRoaXMuc3RydWN0dXJlZFJ1bGVzID0gdGhpcy5zdHJ1Y3R1cmVSdWxlcyhPYmplY3Qua2V5cyh0aGlzLmNvbWJpbmVkUnVsZXMpLm1hcChrZXkgPT4gdGhpcy5jb21iaW5lZFJ1bGVzW2tleV0pKTtcclxuICAgICAgICAgICAgICAgIHJldHVybiBPYmplY3Qua2V5cyh0aGlzLmNvbWJpbmVkUnVsZXMpLm1hcChydWxlSWQgPT4gdGhpcy5jb21iaW5lZFJ1bGVzW3J1bGVJZF0pO1xyXG4gICAgICAgICAgICB9KVxyXG4gICAgICAgICAgICAuY2F0Y2goY29uc29sZS5lcnJvcilcclxuICAgICAgICAgICAgLmZpbmFsbHkoKCkgPT4ge1xyXG4gICAgICAgICAgICAgICAgdGhpcy5jdXJyZW50VGFzayA9IG51bGw7XHJcbiAgICAgICAgICAgIH0pO1xyXG4gICAgICAgIHJldHVybiB0aGlzLmN1cnJlbnRUYXNrO1xyXG4gICAgfVxyXG5cclxuICAgIHB1YmxpYyBnZXRSdWxlc0RhdGEgKHJ1bGVzSWRzOiBzdHJpbmdbXSk6IElSdWxlW10ge1xyXG4gICAgICAgIHJldHVybiBydWxlc0lkcy5tYXAocnVsZUlkID0+IHRoaXMuY29tYmluZWRSdWxlc1tydWxlSWRdKTtcclxuICAgIH1cclxuXHJcbiAgICBwdWJsaWMgdW5sb2FkICgpOiB2b2lkIHtcclxuICAgICAgICB0aGlzLmFib3J0Q3VycmVudFRhc2soKTtcclxuICAgIH1cclxufSIsIi8vLyA8cmVmZXJlbmNlIHBhdGg9XCIuLi9ibHVlYmlyZC5kLnRzXCIvPlxyXG5pbXBvcnQgR3JvdXBzQnVpbGRlciBmcm9tIFwiLi9ncm91cHNCdWlsZGVyXCI7XHJcbmltcG9ydCAqIGFzIFV0aWxzIGZyb20gXCIuL3V0aWxzXCI7XHJcblxyXG5leHBvcnQgZGVmYXVsdCBjbGFzcyBTZWN1cml0eUNsZWFyYW5jZXNCdWlsZGVyIGV4dGVuZHMgR3JvdXBzQnVpbGRlciB7XHJcblxyXG4gICAgY29uc3RydWN0b3IoYXBpOiBhbnkpIHtcclxuICAgICAgICBzdXBlcihhcGkpO1xyXG4gICAgfVxyXG5cclxuICAgIHByaXZhdGUgZ2V0U2VjdXJpdHlHcm91cHMgKCk6IFByb21pc2U8YW55PiB7XHJcbiAgICAgICAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlLCByZWplY3QpID0+IHtcclxuICAgICAgICAgICAgdGhpcy5hcGkuZ2V0U2Vzc2lvbigoc2Vzc2lvbkRhdGEpID0+IHtcclxuICAgICAgICAgICAgICAgIHRoaXMuYXBpLmNhbGwoXCJHZXRcIiwge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB0eXBlTmFtZTogXCJHcm91cFwiLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICBzZWFyY2g6IHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlkOiBcIkdyb3VwU2VjdXJpdHlJZFwiXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICB9LCByZXNvbHZlLCByZWplY3QpO1xyXG4gICAgICAgICAgICB9KTtcclxuICAgICAgICB9KTtcclxuICAgIH07XHJcblxyXG4gICAgcHVibGljIGZldGNoICgpOiBQcm9taXNlPGFueT4ge1xyXG4gICAgICAgIHRoaXMuYWJvcnRDdXJyZW50VGFzaygpO1xyXG4gICAgICAgIHRoaXMuY3VycmVudFRhc2sgPSB0aGlzLmdldFNlY3VyaXR5R3JvdXBzKClcclxuICAgICAgICAgICAgLnRoZW4oZ3JvdXBzID0+IHtcclxuICAgICAgICAgICAgICAgIHRoaXMuZ3JvdXBzID0gZ3JvdXBzO1xyXG4gICAgICAgICAgICAgICAgdGhpcy50cmVlID0gdGhpcy5jcmVhdGVHcm91cHNUcmVlKGdyb3Vwcyk7XHJcbiAgICAgICAgICAgICAgICB0aGlzLmN1cnJlbnRUcmVlID0gVXRpbHMuZXh0ZW5kKHt9LCB0aGlzLnRyZWUpO1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIHRoaXMuY3JlYXRlRmxhdEdyb3Vwc0xpc3QodGhpcy50cmVlKS5maWx0ZXIoZ3JvdXAgPT4gISFncm91cC5uYW1lKTtcclxuICAgICAgICAgICAgfSlcclxuICAgICAgICAgICAgLmNhdGNoKGNvbnNvbGUuZXJyb3IpXHJcbiAgICAgICAgICAgIC5maW5hbGx5KCgpID0+IHtcclxuICAgICAgICAgICAgICAgIHRoaXMuY3VycmVudFRhc2sgPSBudWxsO1xyXG4gICAgICAgICAgICB9KTtcclxuICAgICAgICByZXR1cm4gdGhpcy5jdXJyZW50VGFzaztcclxuICAgIH07XHJcbn0iLCIvLy8gPHJlZmVyZW5jZSBwYXRoPVwiLi4vYmx1ZWJpcmQuZC50c1wiLz5cclxuaW50ZXJmYWNlIElDbGFzc0NvbnRyb2wge1xyXG4gICAgZ2V0OiAoKSA9PiBzdHJpbmc7XHJcbiAgICBzZXQ6IChuYW1lOiBzdHJpbmcpID0+IHZvaWQ7XHJcbn1cclxuXHJcbmV4cG9ydCBpbnRlcmZhY2UgSUVudGl0eSB7XHJcbiAgICBpZDogc3RyaW5nO1xyXG4gICAgW3Byb3BOYW1lOiBzdHJpbmddOiBhbnk7XHJcbn1cclxuXHJcbnR5cGUgSVNvcnRQcm9wZXJ0eSA9IHN0cmluZyB8IFtzdHJpbmcsIFwiYXNjXCIgfCBcImRlc2NcIl07XHJcblxyXG5sZXQgY2xhc3NOYW1lQ3RybCA9IGZ1bmN0aW9uIChlbDogRWxlbWVudCk6IElDbGFzc0NvbnRyb2wge1xyXG4gICAgICAgIHZhciBwYXJhbSA9IHR5cGVvZiBlbC5jbGFzc05hbWUgPT09IFwic3RyaW5nXCIgPyBcImNsYXNzTmFtZVwiIDogXCJiYXNlVmFsXCI7XHJcbiAgICAgICAgcmV0dXJuIHtcclxuICAgICAgICAgICAgZ2V0OiBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gZWxbcGFyYW1dIHx8IFwiXCI7XHJcbiAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgIHNldDogZnVuY3Rpb24gKHRleHQpIHtcclxuICAgICAgICAgICAgICAgIGVsW3BhcmFtXSA9IHRleHQ7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9O1xyXG4gICAgfSxcclxuICAgIGlzVXN1YWxPYmplY3QgPSBmdW5jdGlvbiAob2JqKSB7XHJcbiAgICAgICAgcmV0dXJuIE9iamVjdC5wcm90b3R5cGUudG9TdHJpbmcuY2FsbChvYmopLmluZGV4T2YoXCJPYmplY3RcIikgIT09IC0xO1xyXG4gICAgfTtcclxuXHJcbmV4cG9ydCBpbnRlcmZhY2UgSUhhc2gge1xyXG4gICAgW2lkOiBzdHJpbmddOiBhbnk7XHJcbn1cclxuXHJcbmV4cG9ydCBmdW5jdGlvbiByZW1vdmVDbGFzcyhlbDogRWxlbWVudCwgbmFtZTogc3RyaW5nKTogdm9pZCB7XHJcbiAgICBpZiAoIWVsKSB7XHJcbiAgICAgICAgcmV0dXJuO1xyXG4gICAgfVxyXG4gICAgbGV0IGNsYXNzZXNTdHIgPSBjbGFzc05hbWVDdHJsKGVsKS5nZXQoKSxcclxuICAgICAgICBjbGFzc2VzID0gY2xhc3Nlc1N0ci5zcGxpdChcIiBcIiksXHJcbiAgICAgICAgbmV3Q2xhc3NlcyA9IGNsYXNzZXMuZmlsdGVyKGNsYXNzSXRlbSA9PiBjbGFzc0l0ZW0gIT09IG5hbWUpO1xyXG4gICAgY2xhc3NOYW1lQ3RybChlbCkuc2V0KG5ld0NsYXNzZXMuam9pbihcIiBcIikpO1xyXG59XHJcblxyXG5leHBvcnQgZnVuY3Rpb24gYWRkQ2xhc3MoZWwsIG5hbWUpOiB2b2lkIHtcclxuICAgIGlmICghZWwpIHtcclxuICAgICAgICByZXR1cm47XHJcbiAgICB9XHJcbiAgICBsZXQgY2xhc3Nlc1N0ciA9IGNsYXNzTmFtZUN0cmwoZWwpLmdldCgpLFxyXG4gICAgICAgIGNsYXNzZXMgPSBjbGFzc2VzU3RyLnNwbGl0KFwiIFwiKTtcclxuICAgIGlmIChjbGFzc2VzLmluZGV4T2YobmFtZSkgPT09IC0xKSB7XHJcbiAgICAgICAgY2xhc3NOYW1lQ3RybChlbCkuc2V0KGNsYXNzZXNTdHIgKyBcIiBcIiArIG5hbWUpO1xyXG4gICAgfVxyXG59XHJcblxyXG5leHBvcnQgZnVuY3Rpb24gaGFzQ2xhc3MoZWw6IEVsZW1lbnQsIGNsYXNzTmFtZTogc3RyaW5nKTogYm9vbGVhbiB7XHJcbiAgICByZXR1cm4gZWwgJiYgY2xhc3NOYW1lQ3RybChlbCkuZ2V0KCkuaW5kZXhPZihjbGFzc05hbWUpICE9PSAtMTtcclxufVxyXG5cclxuZXhwb3J0IGZ1bmN0aW9uIGV4dGVuZCguLi5hcmdzOiBhbnlbXSkge1xyXG4gICAgdmFyIGxlbmd0aCA9IGFyZ3MubGVuZ3RoLFxyXG4gICAgICAgIHNyYywgc3JjS2V5cywgc3JjQXR0cixcclxuICAgICAgICBmdWxsQ29weSA9IGZhbHNlLFxyXG4gICAgICAgIHJlc0F0dHIsXHJcbiAgICAgICAgcmVzID0gYXJnc1swXSwgaSA9IDEsIGo7XHJcblxyXG4gICAgaWYgKHR5cGVvZiByZXMgPT09IFwiYm9vbGVhblwiKSB7XHJcbiAgICAgICAgZnVsbENvcHkgPSByZXM7XHJcbiAgICAgICAgcmVzID0gYXJnc1sxXTtcclxuICAgICAgICBpKys7XHJcbiAgICB9XHJcbiAgICB3aGlsZSAoaSAhPT0gbGVuZ3RoKSB7XHJcbiAgICAgICAgc3JjID0gYXJnc1tpXTtcclxuICAgICAgICBzcmNLZXlzID0gT2JqZWN0LmtleXMoc3JjKTtcclxuICAgICAgICBmb3IgKGogPSAwOyBqIDwgc3JjS2V5cy5sZW5ndGg7IGorKykge1xyXG4gICAgICAgICAgICBzcmNBdHRyID0gc3JjW3NyY0tleXNbal1dO1xyXG4gICAgICAgICAgICBpZiAoZnVsbENvcHkgJiYgKGlzVXN1YWxPYmplY3Qoc3JjQXR0cikgfHwgQXJyYXkuaXNBcnJheShzcmNBdHRyKSkpIHtcclxuICAgICAgICAgICAgICAgIHJlc0F0dHIgPSByZXNbc3JjS2V5c1tqXV07XHJcbiAgICAgICAgICAgICAgICByZXNBdHRyID0gcmVzW3NyY0tleXNbal1dID0gKGlzVXN1YWxPYmplY3QocmVzQXR0cikgfHwgQXJyYXkuaXNBcnJheShyZXNBdHRyKSkgPyByZXNBdHRyIDogKEFycmF5LmlzQXJyYXkoc3JjQXR0cikgPyBbXSA6IHt9KTtcclxuICAgICAgICAgICAgICAgIGV4dGVuZChmdWxsQ29weSwgcmVzQXR0ciwgc3JjQXR0cik7XHJcbiAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICByZXNbc3JjS2V5c1tqXV0gPSBzcmNbc3JjS2V5c1tqXV07XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICAgICAgaSsrO1xyXG4gICAgfVxyXG4gICAgcmV0dXJuIHJlcztcclxufVxyXG5cclxuZXhwb3J0IGZ1bmN0aW9uIGVudGl0eVRvRGljdGlvbmFyeShlbnRpdGllczogYW55W10sIGVudGl0eUNhbGxiYWNrPzogKGVudGl0eTogYW55KSA9PiBhbnkpOiBJSGFzaCB7XHJcbiAgICB2YXIgZW50aXR5LCBvID0ge30sIGksXHJcbiAgICAgICAgbCA9IGVudGl0aWVzLmxlbmd0aDtcclxuXHJcbiAgICBmb3IgKGkgPSAwOyBpIDwgbDsgaSsrKSB7XHJcbiAgICAgICAgaWYgKGVudGl0aWVzW2ldKSB7XHJcbiAgICAgICAgICAgIGVudGl0eSA9IGVudGl0aWVzW2ldLmlkID8gZW50aXRpZXNbaV0gOiB7aWQ6IGVudGl0aWVzW2ldfTtcclxuICAgICAgICAgICAgb1tlbnRpdHkuaWRdID0gZW50aXR5Q2FsbGJhY2sgPyBlbnRpdHlDYWxsYmFjayhlbnRpdHkpIDogZW50aXR5O1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuICAgIHJldHVybiBvO1xyXG59XHJcblxyXG5leHBvcnQgZnVuY3Rpb24gc29ydEFycmF5T2ZFbnRpdGllcyhlbnRpdGllczogYW55W10sIHNvcnRpbmdGaWVsZHM6IElTb3J0UHJvcGVydHlbXSk6IGFueVtdIHtcclxuICAgIGxldCBjb21wYXJhdG9yID0gKHByZXZJdGVtLCBuZXh0SXRlbSwgcHJvcGVydGllczogYW55W10sIGluZGV4ID0gMCkgPT4ge1xyXG4gICAgICAgIGlmIChwcm9wZXJ0aWVzLmxlbmd0aCA8PSBpbmRleCkge1xyXG4gICAgICAgICAgICByZXR1cm4gMDtcclxuICAgICAgICB9XHJcbiAgICAgICAgbGV0IG9wdGlvbnMgPSBwcm9wZXJ0aWVzW2luZGV4XSxcclxuICAgICAgICAgICAgW3Byb3BlcnR5LCBkaXIgPSBcImFzY1wiXSA9IEFycmF5LmlzQXJyYXkob3B0aW9ucykgPyBvcHRpb25zIDogW29wdGlvbnNdLFxyXG4gICAgICAgICAgICBkaXJNdWx0aXBsaWVyOiBudW1iZXI7XHJcbiAgICAgICAgZGlyTXVsdGlwbGllciA9IGRpciA9PT0gXCJhc2NcIiA/IDEgOiAtMTtcclxuICAgICAgICBpZiAocHJldkl0ZW1bcHJvcGVydHldID4gbmV4dEl0ZW1bcHJvcGVydHldKSB7XHJcbiAgICAgICAgICAgIHJldHVybiAxICogZGlyTXVsdGlwbGllcjtcclxuICAgICAgICB9IGVsc2UgaWYgKHByZXZJdGVtW3Byb3BlcnR5XSA8IG5leHRJdGVtW3Byb3BlcnR5XSkge1xyXG4gICAgICAgICAgICByZXR1cm4gLTEgKiBkaXJNdWx0aXBsaWVyO1xyXG4gICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgIHJldHVybiBjb21wYXJhdG9yKHByZXZJdGVtLCBuZXh0SXRlbSwgcHJvcGVydGllcywgaW5kZXggKyAxKTtcclxuICAgICAgICB9XHJcbiAgICB9O1xyXG4gICAgcmV0dXJuIGVudGl0aWVzLnNvcnQoKHByZXZUZW1wbGF0ZSwgbmV4dFRlbXBsYXRlKSA9PiB7XHJcbiAgICAgICAgcmV0dXJuIGNvbXBhcmF0b3IocHJldlRlbXBsYXRlLCBuZXh0VGVtcGxhdGUsIHNvcnRpbmdGaWVsZHMpO1xyXG4gICAgfSk7XHJcbn1cclxuXHJcbmV4cG9ydCBmdW5jdGlvbiBkb3dubG9hZERhdGFBc0ZpbGUoZGF0YTogc3RyaW5nLCBmaWxlbmFtZTogc3RyaW5nLCBtaW1lVHlwZSA9IFwidGV4dC9qc29uXCIpIHtcclxuICAgIGxldCBibG9iID0gbmV3IEJsb2IoW2RhdGFdLCB7dHlwZTogbWltZVR5cGV9KSxcclxuICAgICAgICBlbGVtO1xyXG4gICAgaWYgKHdpbmRvdy5uYXZpZ2F0b3IubXNTYXZlT3JPcGVuQmxvYikge1xyXG4gICAgICAgIHdpbmRvdy5uYXZpZ2F0b3IubXNTYXZlQmxvYihibG9iLCBmaWxlbmFtZSk7XHJcbiAgICB9IGVsc2Uge1xyXG4gICAgICAgIGVsZW0gPSB3aW5kb3cuZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcImFcIik7XHJcbiAgICAgICAgZWxlbS5ocmVmID0gd2luZG93LlVSTC5jcmVhdGVPYmplY3RVUkwoYmxvYik7XHJcbiAgICAgICAgZWxlbS5kb3dubG9hZCA9IGZpbGVuYW1lO1xyXG4gICAgICAgIGRvY3VtZW50LmJvZHkuYXBwZW5kQ2hpbGQoZWxlbSk7XHJcbiAgICAgICAgZWxlbS5jbGljaygpO1xyXG4gICAgICAgIGRvY3VtZW50LmJvZHkucmVtb3ZlQ2hpbGQoZWxlbSk7XHJcbiAgICB9XHJcbn1cclxuXHJcbmV4cG9ydCBmdW5jdGlvbiBtZXJnZVVuaXF1ZUVudGl0aWVzICguLi5zb3VyY2VzOiBJRW50aXR5W11bXSk6IElFbnRpdHlbXSB7XHJcbiAgICBsZXQgYWRkZWRJZHM6IHN0cmluZ1tdID0gW10sXHJcbiAgICAgICAgbWVyZ2VkSXRlbXM6IElFbnRpdHlbXSA9IFtdO1xyXG4gICAgc291cmNlcy5mb3JFYWNoKHNvdXJjZSA9PiBzb3VyY2UuZm9yRWFjaChpdGVtID0+IHtcclxuICAgICAgICBpZiAoaXRlbSAmJiBpdGVtLmlkICYmIGFkZGVkSWRzLmluZGV4T2YoaXRlbS5pZCkgPT09IC0xKSB7XHJcbiAgICAgICAgICAgIGFkZGVkSWRzLnB1c2goaXRlbS5pZCk7XHJcbiAgICAgICAgICAgIG1lcmdlZEl0ZW1zLnB1c2goaXRlbSk7XHJcbiAgICAgICAgfVxyXG4gICAgfSkpO1xyXG4gICAgcmV0dXJuIG1lcmdlZEl0ZW1zO1xyXG59XHJcblxyXG5leHBvcnQgZnVuY3Rpb24gZ2V0RW50aXRpZXNJZHMgKGVudGl0aWVzTGlzdDogSUVudGl0eVtdKTogc3RyaW5nW10ge1xyXG4gICAgcmV0dXJuIEFycmF5LmlzQXJyYXkoZW50aXRpZXNMaXN0KSAmJiBlbnRpdGllc0xpc3QucmVkdWNlKChyZXN1bHQsIGVudGl0eSkgPT4ge1xyXG4gICAgICAgIGVudGl0eSAmJiBlbnRpdHkuaWQgJiYgcmVzdWx0LnB1c2goZW50aXR5LmlkKTtcclxuICAgICAgICByZXR1cm4gcmVzdWx0O1xyXG4gICAgfSwgW10pIHx8IFtdO1xyXG59XHJcblxyXG5leHBvcnQgZnVuY3Rpb24gbWVyZ2VVbmlxdWUgKC4uLnNvdXJjZXM6IHN0cmluZ1tdW10pOiBzdHJpbmdbXSB7XHJcbiAgICBsZXQgbWVyZ2VkSXRlbXM6IHN0cmluZ1tdID0gW107XHJcbiAgICBzb3VyY2VzLmZvckVhY2goc291cmNlID0+IHtcclxuICAgICAgICBBcnJheS5pc0FycmF5KHNvdXJjZSkgJiYgc291cmNlLmZvckVhY2goaXRlbSA9PiB7XHJcbiAgICAgICAgICAgIGl0ZW0gJiYgbWVyZ2VkSXRlbXMuaW5kZXhPZihpdGVtKSA9PT0gLTEgJiYgbWVyZ2VkSXRlbXMucHVzaChpdGVtKTtcclxuICAgICAgICB9KTtcclxuICAgIH0pO1xyXG4gICAgcmV0dXJuIG1lcmdlZEl0ZW1zO1xyXG59XHJcblxyXG5leHBvcnQgZnVuY3Rpb24gZ2V0VW5pcXVlRW50aXRpZXMgKG5ld0VudGl0aWVzOiBJRW50aXR5W10sIGV4aXN0ZWRFbnRpdGllczogSUVudGl0eVtdKTogSUVudGl0eVtdIHtcclxuICAgIGxldCBzZWxlY3RlZEVudGl0aWVzSGFzaCA9IGVudGl0eVRvRGljdGlvbmFyeShleGlzdGVkRW50aXRpZXMpO1xyXG4gICAgcmV0dXJuIG5ld0VudGl0aWVzLnJlZHVjZSgocmVzLCBlbnRpdHkpID0+IHtcclxuICAgICAgICAhc2VsZWN0ZWRFbnRpdGllc0hhc2hbZW50aXR5LmlkXSAmJiByZXMucHVzaChlbnRpdHkpO1xyXG4gICAgICAgIHJldHVybiByZXM7XHJcbiAgICB9LCBbXSk7XHJcbn1cclxuXHJcbmV4cG9ydCBmdW5jdGlvbiB0b2dldGhlcihwcm9taXNlczogUHJvbWlzZTxhbnk+W10pOiBQcm9taXNlPGFueT4ge1xyXG4gICAgbGV0IHJlc3VsdHMgPSBbXSxcclxuICAgICAgICByZXN1bHRzQ291bnQgPSAwO1xyXG4gICAgcmVzdWx0cy5sZW5ndGggPSBwcm9taXNlcy5sZW5ndGg7XHJcbiAgICByZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUsIHJlamVjdCkgPT4ge1xyXG4gICAgICAgIGxldCByZXNvbHZlQWxsID0gKCkgPT4ge1xyXG4gICAgICAgICAgICByZXR1cm4gcmVzb2x2ZShyZXN1bHRzKTtcclxuICAgICAgICB9O1xyXG4gICAgICAgIHByb21pc2VzLmxlbmd0aCA/IHByb21pc2VzLmZvckVhY2goKHByb21pc2UsIGluZGV4KSA9PiB7XHJcbiAgICAgICAgICAgIHByb21pc2UudGhlbigocmVzdWx0KSA9PiB7XHJcbiAgICAgICAgICAgICAgICByZXN1bHRzQ291bnQrKztcclxuICAgICAgICAgICAgICAgIHJlc3VsdHNbaW5kZXhdID0gcmVzdWx0O1xyXG4gICAgICAgICAgICAgICAgcmVzdWx0c0NvdW50ID09PSBwcm9taXNlcy5sZW5ndGggJiYgcmVzb2x2ZUFsbCgpO1xyXG4gICAgICAgICAgICB9KS5jYXRjaCgoZXJyb3IpID0+IHtcclxuICAgICAgICAgICAgICAgIHJlamVjdCh7XHJcbiAgICAgICAgICAgICAgICAgICAgZXJyb3I6IGVycm9yLFxyXG4gICAgICAgICAgICAgICAgICAgIHByb21pc2VJbmRleDogaW5kZXhcclxuICAgICAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgICB9KTtcclxuICAgICAgICB9KSA6IHJlc29sdmVBbGwoKTtcclxuICAgIH0pO1xyXG59XHJcblxyXG5leHBvcnQgZnVuY3Rpb24gcmVzb2x2ZWRQcm9taXNlPFQ+ICh2YWw/OiBUKTogUHJvbWlzZTxUPiB7XHJcbiAgICByZXR1cm4gbmV3IFByb21pc2U8VD4ocmVzb2x2ZSA9PiByZXNvbHZlKHZhbCkpO1xyXG59XHJcblxyXG5leHBvcnQgZnVuY3Rpb24gdG9BcnJheSAoZGF0YSkge1xyXG4gICAgcmV0dXJuIEFycmF5LmlzQXJyYXkoZGF0YSkgPyBkYXRhIDogW2RhdGFdO1xyXG59IiwiZXhwb3J0IGRlZmF1bHQgY2xhc3MgV2FpdGluZyB7XHJcblxyXG4gICAgcHJpdmF0ZSB3YWl0aW5nQ29udGFpbmVyOiBIVE1MRWxlbWVudDtcclxuICAgIHByaXZhdGUgYm9keUVsOiBIVE1MRWxlbWVudCA9IGRvY3VtZW50LmJvZHk7XHJcblxyXG4gICAgcHVibGljIHN0YXJ0KGVsOiBIVE1MRWxlbWVudCA9IHRoaXMuYm9keUVsLCB6SW5kZXg/OiBudW1iZXIpIHtcclxuICAgICAgICBpZiAoZWwub2Zmc2V0UGFyZW50ID09PSBudWxsKSB7XHJcbiAgICAgICAgICAgIHJldHVybiBmYWxzZTtcclxuICAgICAgICB9XHJcbiAgICAgICAgdGhpcy53YWl0aW5nQ29udGFpbmVyID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcImRpdlwiKTtcclxuICAgICAgICB0aGlzLndhaXRpbmdDb250YWluZXIuY2xhc3NOYW1lID0gXCJ3YWl0aW5nXCI7XHJcbiAgICAgICAgdGhpcy53YWl0aW5nQ29udGFpbmVyLmlubmVySFRNTCA9IFwiPGRpdiBjbGFzcz0nZmFkZXInPjwvZGl2PjxkaXYgY2xhc3M9J3NwaW5uZXInPjwvZGl2PlwiO1xyXG4gICAgICAgIGVsLnBhcmVudE5vZGUuYXBwZW5kQ2hpbGQodGhpcy53YWl0aW5nQ29udGFpbmVyKTtcclxuXHJcbiAgICAgICAgdGhpcy53YWl0aW5nQ29udGFpbmVyLnN0eWxlLnBvc2l0aW9uID0gXCJhYnNvbHV0ZVwiO1xyXG4gICAgICAgIHRoaXMud2FpdGluZ0NvbnRhaW5lci5zdHlsZS53aWR0aCA9IGVsLm9mZnNldFdpZHRoICsgXCJweFwiO1xyXG4gICAgICAgIHRoaXMud2FpdGluZ0NvbnRhaW5lci5zdHlsZS5oZWlnaHQgPSBlbC5vZmZzZXRIZWlnaHQgKyBcInB4XCI7XHJcbiAgICAgICAgdGhpcy53YWl0aW5nQ29udGFpbmVyLnN0eWxlLnRvcCA9IGVsLm9mZnNldFRvcCArIFwicHhcIjtcclxuICAgICAgICB0aGlzLndhaXRpbmdDb250YWluZXIuc3R5bGUubGVmdCA9IGVsLm9mZnNldExlZnQgKyBcInB4XCI7XHJcbiAgICAgICAgdGhpcy53YWl0aW5nQ29udGFpbmVyLnN0eWxlLmRpc3BsYXkgPSBcImJsb2NrXCI7XHJcbiAgICAgICAgdHlwZW9mIHpJbmRleCA9PT0gXCJudW1iZXJcIiAmJiAodGhpcy53YWl0aW5nQ29udGFpbmVyLnN0eWxlLnpJbmRleCA9IHpJbmRleC50b1N0cmluZygpKTtcclxuICAgIH07XHJcblxyXG4gICAgcHVibGljIHN0b3AgKCkge1xyXG4gICAgICAgIGlmICh0aGlzLndhaXRpbmdDb250YWluZXIgJiYgdGhpcy53YWl0aW5nQ29udGFpbmVyLnBhcmVudE5vZGUpIHtcclxuICAgICAgICAgICAgdGhpcy53YWl0aW5nQ29udGFpbmVyLnBhcmVudE5vZGUucmVtb3ZlQ2hpbGQodGhpcy53YWl0aW5nQ29udGFpbmVyKTtcclxuICAgICAgICB9XHJcbiAgICB9O1xyXG59Il19
