import React, { useRef, useEffect, useState } from "react";
import {
    useForm,
    type SubmitHandler,
    useFieldArray,
    UseFormRegister,
    FieldErrors,
    UseFieldArrayReturn,
    FieldArray,
} from "react-hook-form";
import { getEventBySlug, updateEvent } from "@/services/EventAdminService";
import { broadcastNotification } from "@/services/NotificationService";
import { transformCategory, validateCategory } from "@/utils/eventListing";
import { Clickable } from "../Clickable";
import { EventFormType } from "@/types/events";
import { getDefaultData } from "@/utils/eventListing";

function StringInputField({
    field,
    placeholder,
    register,
    errors,
    multiline = false,
    isCategory = false,
    isNumber = false,
    note,
}: {
    field: keyof EventFormType;
    placeholder: string;
    register: UseFormRegister<EventFormType>;
    errors: FieldErrors<EventFormType>;
    multiline?: boolean;
    isCategory?: boolean;
    isNumber?: boolean;
    note?: string;
}) {
    return (
        <div className="flex flex-col gap-y-1 my-1">
            <p className="text-lg">{placeholder}</p>
            {note && <p className="text-sm">Note: {note}</p>}
            {multiline ? (
                <textarea
                    className="outline-none border border-black bg-white/4 text-black placeholder-black py-2 px-3 text-sm focus:border-black focus:bg-yellow/6 transition-colors duration-200"
                    {...register(field, {
                        required: `${placeholder} is required`,
                    })}
                    placeholder={placeholder}
                />
            ) : (
                <input
                    type={isNumber ? "number" : "text"}
                    className="outline-none border border-black bg-white/4 text-black placeholder-black py-2 px-3 text-sm focus:border-black focus:bg-yellow/6 transition-colors duration-200"
                    {...register(field, {
                        required: `${placeholder} is required`,
                        setValueAs: isCategory ? transformCategory : undefined,
                        validate: isCategory ? validateCategory : undefined,
                    })}
                    placeholder={placeholder}
                />
            )}
            <span
                className={`text-xs ${
                    errors[field] ? "text-yellow" : "text-transparent"
                }`}
            >
                {errors[field]?.message}
            </span>
        </div>
    );
}

function StringArrayInputField<
    T extends "rules" | "prizes" | "eventDates" | "coordinators" | "tags",
>({
    fieldName,
    fieldArray,
    register,
    placeholder,
    limit,
}: {
    fieldName: T;
    fieldArray: UseFieldArrayReturn<EventFormType, T>;
    register: UseFormRegister<EventFormType>;
    placeholder: string;
    limit: number;
}) {
    return (
        <>
            <p className="text-xs tracking-[0.15em] text-black uppercase mb-1">
                {fieldName}
            </p>
            {fieldName === "coordinators" && (
                <div className="flex flex-col">
                    <p className="text-sm">Format: Name, Phone</p>
                    <p className="text-sm">Example: John Doe, 9898989898</p>
                </div>
            )}
            <div className="flex gap-3 items-baseline w-full">
                <div className="flex flex-col gap-y-2 w-full">
                    {fieldArray.fields.map(
                        (field: Record<"id", string>, index: number) => {
                            return (
                                <div
                                    key={field.id}
                                    className="flex w-full gap-3 items-center"
                                >
                                    <input
                                        type="text"
                                        {...register(
                                            `${fieldName}.${index}.value` as const,
                                        )}
                                        className="outline-none border border-black bg-white/4 text-black placeholder-black py-2 px-3 text-sm focus:border-black focus:bg-yellow/6 transition-colors duration-200 w-full sm:grow"
                                        placeholder={`${placeholder} ${index + 1}`}
                                    />
                                    {index > 0 && (
                                        <button
                                            type="button"
                                            onClick={() =>
                                                fieldArray.remove(index)
                                            }
                                            className="shrink-0 text-[0.65rem] font-medium tracking-[0.12em] uppercase px-3 py-1.5 border border-red-800/60 text-black bg-transparent hover:bg-red-900/30 hover:text-red-300 transition-colors duration-200"
                                        >
                                            Remove
                                        </button>
                                    )}
                                </div>
                            );
                        },
                    )}
                </div>
                {fieldArray.fields.length < limit && (
                    <button
                        type="button"
                        onClick={() =>
                            fieldArray.append({ value: "" } as FieldArray<
                                EventFormType,
                                T
                            >)
                        }
                        className="shrink-0 text-[0.65rem] font-medium tracking-[0.12em] uppercase px-3 py-1.5 border border-red-800/60 text-black bg-transparent hover:bg-red-900/30 hover:text-red-300 transition-colors duration-200"
                    >
                        Add
                    </button>
                )}
            </div>
        </>
    );
}

function EditEventDetails({ slug }: { slug: string | undefined }) {
    const dialogRef = useRef<HTMLDialogElement>(null);
    const [eventData, setEventData] = useState<EventFormType>(
        getDefaultData(slug),
    );
    const [loading, setLoading] = useState<boolean>(true);
    const [message, setMessage] = useState<string>("");

    const {
        register,
        handleSubmit,
        control,
        reset,
        formState: { errors },
    } = useForm<EventFormType>({ defaultValues: eventData });

    const rules = useFieldArray({
        control,
        name: "rules",
        rules: { maxLength: 15 },
    });
    const prizes = useFieldArray({
        control,
        name: "prizes",
        rules: { maxLength: 5 },
    });
    const dates = useFieldArray({
        control,
        name: "eventDates",
        rules: { maxLength: 4 },
    });
    const coordinators = useFieldArray({
        control,
        name: "coordinators",
        rules: { maxLength: 3 },
    });
    const tags = useFieldArray({
        control,
        name: "tags",
        rules: { maxLength: 4 },
    });

    useEffect(() => {
        const fetchEvent = async (slug: string | undefined) => {
            if (!slug) return false;

            const data = await getEventBySlug(slug);
            if (!data) return false;

            reset(data);
            setEventData(data);
            return true;
        };

        fetchEvent(slug).finally(() => setLoading(false));
    }, [slug, reset]);

    if (!slug) return;
    if (loading) return <div>Loading...</div>;

    const onSubmit: SubmitHandler<EventFormType> = (data) => {
        setMessage("Submitting..");
        updateEvent(data).then(async (updatedEvent) => {
            setMessage(updatedEvent.message);
            if (updatedEvent.ok) {
                await broadcastNotification(
                    `Event Updated: ${data.name}`,
                    `${data.name} has been updated. Check the latest details on the events page.`
                );
            }
            console.log(updatedEvent);
        });
    };

    const openDialog = () => dialogRef.current?.showModal();
    const closeDialog = () => dialogRef.current?.close();

    return (
        <>
            <Clickable
                as="button"
                onClick={openDialog}
                className="bg-black text-white"
            >
                Manage Listing
            </Clickable>
            <dialog
                ref={dialogRef}
                className="fixed top-1/2 left-1/2 z-300 w-full max-w-2xl -translate-1/2 bg-gray-300 text-black p-0 backdrop:bg-black/85"
                onClick={(e) => {
                    if (e.target === dialogRef.current) close();
                }}
            >
                <div className="flex flex-col h-[90vh] max-h-[90vh] items-center gap-6 px-8 py-7 flex-1 overflow-y-auto">
                    <span tabIndex={0} className="sr-only" />
                    <div className="flex justify-between w-full border-b border-red-900/40 pb-4">
                        <h2 className="font-elnath text-2xl tracking-widest uppercase">
                            Manage Event Listing
                        </h2>
                        <button
                            onClick={closeDialog}
                            className="px-3 py-1.5 border border-white/80 text-black bg-transparent"
                        >
                            Close
                        </button>
                    </div>
                    <form
                        onSubmit={handleSubmit(onSubmit)}
                        className="flex flex-col gap-y-1 w-full flex-1"
                    >
                        <StringInputField
                            field="name"
                            placeholder="Event Name"
                            register={register}
                            errors={errors}
                        />

                        <StringInputField
                            field="slug"
                            placeholder="Event Slug"
                            register={register}
                            errors={errors}
                        />

                        <StringInputField
                            field="category"
                            placeholder="Event Category"
                            register={register}
                            errors={errors}
                            isCategory={true}
                        />

                        <StringInputField
                            field="description"
                            placeholder="Event Description"
                            register={register}
                            errors={errors}
                            multiline={true}
                        />

                        <StringInputField
                            field="minMembers"
                            placeholder="Min Members in a team"
                            register={register}
                            errors={errors}
                            isNumber={true}
                        />

                        <StringInputField
                            field="maxMembers"
                            placeholder="Max Members in a team"
                            register={register}
                            errors={errors}
                            isNumber={true}
                        />

                        <StringInputField
                            field="format"
                            placeholder="Event Format"
                            register={register}
                            errors={errors}
                        />

                        <StringInputField
                            field="driveLink"
                            placeholder="Drive Link"
                            register={register}
                            errors={errors}
                        />

                        <StringInputField
                            field="prizePool"
                            placeholder="Total Prize Pool"
                            note="Example - Rs. 10,000"
                            register={register}
                            errors={errors}
                        />

                        <StringInputField
                            field="registrationLink"
                            placeholder="Registration Link"
                            note="Only fill this if you are taking registrations somewhere else instead of the Srijan website"
                            register={register}
                            errors={errors}
                        />

                        <StringInputField
                            field="registrationDeadline"
                            placeholder="Registration Deadline"
                            register={register}
                            errors={errors}
                        />

                        <div className="border-t border-red-900/25 my-3" />

                        <StringArrayInputField
                            fieldName="rules"
                            register={register}
                            fieldArray={rules}
                            placeholder="Rule"
                            limit={15}
                        />

                        <div className="border-t border-red-900/25 my-3" />

                        <StringArrayInputField
                            fieldName="prizes"
                            register={register}
                            fieldArray={prizes}
                            placeholder="Prize"
                            limit={5}
                        />

                        <div className="border-t border-red-900/25 my-3" />

                        <StringArrayInputField
                            fieldName="eventDates"
                            register={register}
                            fieldArray={dates}
                            placeholder="Date"
                            limit={4}
                        />

                        <div className="border-t border-red-900/25 my-3" />

                        <StringArrayInputField
                            fieldName="coordinators"
                            register={register}
                            fieldArray={coordinators}
                            placeholder="Coordinator"
                            limit={3}
                        />

                        <div className="border-t border-red-900/25 my-3" />

                        <StringArrayInputField
                            fieldName="tags"
                            register={register}
                            fieldArray={tags}
                            placeholder="Tag"
                            limit={4}
                        />

                        <button
                            type="submit"
                            className="w-full mt-5 py-2.5 px-4 font-elnath tracking-[0.2em] uppercase text-sm bg-red-700 text-black hover:bg-yellow disabled:opacity-40 disabled:cursor-not-allowed transition-colors duration-200"
                            disabled={message === "Submitting.."}
                        >
                            Submit
                        </button>
                    </form>
                    <p className="text-yellow text-sm tracking-wider">
                        {message}
                    </p>
                </div>
            </dialog>
        </>
    );
}

export default EditEventDetails;
