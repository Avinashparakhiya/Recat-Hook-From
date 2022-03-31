import React, { useEffect, useState } from "react"
import { Controller, useForm } from "react-hook-form"
import {
  Button,
  Checkbox,
  Form,
  Header,
  Message,
  Icon,
  Segment,
  Popup,
  Input,
  List
} from "semantic-ui-react"
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import { UploadBlob, UpsertEvent } from "../common/azTableStorageHelper"
import { useAuthContext } from "../hooks/useAuth"
import uuid from "react-uuid"
import Dropzone from "react-dropzone"
import StandardPageLayout from "./pageLayouts/standardPageLayout"
import { StaticImage } from "gatsby-plugin-image"
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"
import {
  faCircleInfo
} from "@fortawesome/free-solid-svg-icons"
import { DateTime } from "luxon"
import Flatpickr from "react-flatpickr"
import countryDetails from "../static/fullpage/countryDetails.json"

const eventTypeOptions = [
  {
    key: "In Person",
    text: "In Person",
    value: "In Person",
  },
  {
    key: "Virtual",
    text: "Virtual",
    value: "Virtual",
  },
  {
    key: "Hybrid",
    text: "Hybrid",
    value: "Hybrid",
  },
]

const URL = (/^((https?|ftp):\/\/)?(www.)?(((([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!\$&'\(\)\*\+,;=]|:)*@)?(((\d|[1-9]\d|1\d\d|2[0-4]\d|25[0-5])\.(\d|[1-9]\d|1\d\d|2[0-4]\d|25[0-5])\.(\d|[1-9]\d|1\d\d|2[0-4]\d|25[0-5])\.(\d|[1-9]\d|1\d\d|2[0-4]\d|25[0-5]))|((([a-z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(([a-z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])*([a-z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])))\.)+(([a-z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(([a-z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])*([a-z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])))\.?)(:\d*)?)(\/((([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!\$&'\(\)\*\+,;=]|:|@)+(\/(([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!\$&'\(\)\*\+,;=]|:|@)*)*)?)?(\?((([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!\$&'\(\)\*\+,;=]|:|@)|[\uE000-\uF8FF]|\/|\?)*)?(\#((([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!\$&'\(\)\*\+,;=]|:|@)|\/|\?)*)?$/i)

const schema = yup.object().shape({
  title: yup.string().required("This field is required"),
  start_date: yup.date().required().typeError("This field is required"),
  end_date: yup.date().required().typeError("This field is required"),
  contact_email: yup.string().email().required("A valid email is required"),
  banner_img_attribution_text: yup.string().required("This field is required"),
  banner_img_attribution_link: yup.string().url().required("A valid url is required"),
  preview_img_attribution_text: yup.string().required("This field is required"),
  preview_img_attribution_link: yup.string().url().required("A valid url is required"),
  event_type: yup.string().required(), //TODO: validate this dropdown is selected
  address1: yup.string().required("This field is required"),
  city: yup.string().required("This field is required"),
  state_province: yup.string().required("This field is required"),
  postal_code: yup.string().required("This field is required"),
  country: yup.string().required("This field is required"),
  registration_start_date: yup.date().required().typeError("This field is required"),
  registration_url: yup.string().url().required("A valid url is required"),
  registration_end_date: yup.date().required().typeError("This field is required"),
  bannerImageRights: yup.mixed().required('Banner image is required'),
  previewImageFiles: yup.mixed().required('Preview image is required'),
  website: yup.string().matches(URL, 'Enter correct url!'),
  drop: yup.string().required("Select a Event")
});

const CreateEvent = () => {
  const {
    control,
    register,
    handleSubmit,
    setValue,
    formState: { errors },
    watch
  } = useForm({
    resolver: yupResolver(schema),
  })
  const drop = watch('drop')
  const start_date = watch('start_date')
  const end_date = watch('end_date')
  const sponsor_call_start_date=watch('sponsor_call_start_date')
  const speaker_call_start_date=watch('speaker_call_start_date')
  const registration_start_date = watch('registration_start_date')
  const { data } = useAuthContext()
  const [bannerImageFiles, setBannerImageFiles] = useState([])
  const [bannerImageRights, setBannerImageRights] = useState(false)
  const [previewImageFiles, setPreviewImageFiles] = useState([])
  const [previewImageRights, setPreviewImageRights] = useState(false)
  const [sponsorProspectus, setsponsorProspectus] = useState([])
  const [eventType, setEventType] = useState();

  //TODO add date time pickers
  const onSubmit = async (formData, e) => {
    const eventId = uuid()
    const container = "events"
    const folder = `${DateTime.fromISO(formData.start_date).toFormat(
      "yyyy"
    )}/${eventId}`

    const uploadFiles = await Promise.all([
      sponsorProspectus.map(s =>
        UploadBlob(s, container, folder).then(r =>
          setValue("sponsor_prospectus", r)
        )
      ),
      bannerImageFiles.map(b =>
        UploadBlob(b, container, folder).then(r => setValue("banner_img", r))
      ),
      previewImageFiles.map(p =>
        UploadBlob(p, container, folder).then(r => setValue("preview_img", r))
      ),
    ])

    //const createEventResult = await UpsertEvent(data.userId, eventId, formData)

    //TODO: VALIDATE EVENT WAS CREATED & FILES UPLOADED
  }

  return (
    <StandardPageLayout title="Create Event">
      <Form onSubmit={handleSubmit(onSubmit)}>
        <Message>
          <Message.Header>New Site Features</Message.Header>
          <Message.List
            items={[
              "This form captures the minimum information required to host an event",
              "New events will always be created in 'Draft' mode. Page details and adjustments can be added later",
            ]}
          />
        </Message>
        <div className="grid grid-cols-2 w-full gap-8">
          <Segment className="!m-0">
            <Header as="h3">General</Header>
            <Form.Field>
              <label>Title</label>
              <Controller
                name="title"
                control={control}
                defaultValue=""
                render={({ field }) => (
                  <Form.Input {...field} placeholder="Title" error={errors?.title?.message} />)}
              />
            </Form.Field>
            <Form.Field >
              <Popup
                trigger={
                  <label>
                    Tagline{" "}
                    <FontAwesomeIcon icon={faCircleInfo} className="pl-1" />
                  </label>
                }
              >
                <Popup.Header>Tagline</Popup.Header>
                <Popup.Content>
                  This is the catch phrase or slogan display in the hero tile.
                  ie "New York's Premier Summer Microsoft Event"
                </Popup.Content>
              </Popup>
              <Controller
                name="tagline"
                control={control}
                defaultValue=""
                render={({ field }) => (
                  <Form.Input {...field} placeholder="Tagline" error={errors?.tagline?.message} />
                )}
              />
            </Form.Field>
            <Form.Field>
              <Popup
                trigger={
                  <label>
                    Timezone{" "}
                    <FontAwesomeIcon icon={faCircleInfo} className="pl-1" />
                  </label>
                }
              >
                <Popup.Header>Timezone</Popup.Header>
                <Popup.Content>
                  Your timezone is automatically detected from your local
                  machine. Your event's time will be based on this zone.
                </Popup.Content>
              </Popup>
              <Controller
                name="timezone"
                control={control}
                defaultValue={DateTime.now().toFormat("z")}
                render={({ field }) => (
                  <Input {...field} value={DateTime.now().toFormat("z")} />
                )}
              />
            </Form.Field>
            <Form.Field >
              <label>Start Date / Time</label>
              <Controller
                name="start_date"
                control={control}
                defaultValue={null}
                render={({ field }) => (
                  <Flatpickr
                    {...field}
                    options={{
                      minDate: new Date(),
                      dateFormat: "F j, Y h:i K",
                      enableTime: true,
                      defaultHour: 8,
                      mode: "single",
                      wrap: true,
                    }}
                  >
                    <Form.Input type="text" iconPosition="left" error={errors?.start_date?.message}>
                      <Icon name="calendar"></Icon>
                      <input data-input placeholder="Select Date" />
                    </Form.Input>
                  </Flatpickr>
                )}
              />
            </Form.Field>

            <Form.Field >
              <label>End Date / Time</label>
              <Controller
                name="end_date"
                control={control}
                render={({ field }) => (
                  <Flatpickr
                    {...field}
                     options={{
                      minDate: new Date(start_date?.toString()),
                      dateFormat: "F j, Y h:i K",
                      enableTime: true,
                      defaultHour: 18,
                      mode: "single",
                      wrap: true,
                      }}
                  >
                    <Form.Input type="text" iconPosition="left" error={errors?.end_date?.message}>
                      <Icon name="calendar"></Icon>
                      <input data-input placeholder="Select Date" disabled={!start_date} />
                    </Form.Input>
                  </Flatpickr>
                )}
              />
            </Form.Field>
  
            <Form.Field >
              <label>Twitter</label>
              <Controller
                name="twitter"
                defaultValue=""
                control={control}
                render={({ field }) => (
                  <Form.Input
                    {...field}
                    icon="at"
                    iconPosition="left"
                    placeholder="Twitter"
                    error={errors?.twitter?.message}
                  />
                )}
              />
            </Form.Field>
            <Form.Field >
              <label>Hashtag</label>
              <Controller
                name="hashtag"
                defaultValue=""
                control={control}
                render={({ field }) => (
                  <Form.Input
                    {...field}
                    icon="hashtag"
                    iconPosition="left"
                    placeholder="Hashtag"
                    error={errors?.hashtag?.message}
                  />
                )}
              />
            </Form.Field>
            <Form.Field>
              <label>Website</label>
              <Controller
                name="website"
                defaultValue=""
                control={control}
                render={({ field }) => (
                  <Form.Input {...field} placeholder="Website" error={errors?.website?.message} />
                )}
              />
            </Form.Field>
            <Form.Field >
              <label>Contact Email</label>
              <Controller
                name="contact_email"
                defaultValue=""
                control={control}
                render={({ field }) => (
                  <Form.Input {...field} placeholder="Contact Email" error={errors?.contact_email?.message} />
                )}
              />
            </Form.Field>
          </Segment>

          <Segment className="!m-0">
            <Header as="h3">Images</Header>
            <Form.Field>
              <Popup
                trigger={
                  <label>
                    Banner Image{" "}
                    <FontAwesomeIcon icon={faCircleInfo} className="pl-1" />
                  </label>
                }
              >
                <Popup.Header>Banner Image</Popup.Header>
                <Popup.Content>
                  <StaticImage
                    alt="Banner Image Preview"
                    src="../images/banner_image_tip.png"
                  ></StaticImage>
                </Popup.Content>
              </Popup>
              <Message icon>
                <Icon name="file image" />
                <Message.Content>
                  <Message.Header>Large Banner Image</Message.Header>
                  <Message.List>
                    <Message.Item>
                      This image will be used upcoming, previous &amp; event
                      finder
                    </Message.Item>
                    <Message.Item>
                      For best results provide and image 2200 x 1200
                    </Message.Item>
                  </Message.List>
                </Message.Content>
              </Message>
              <Dropzone
                onDrop={acceptedFiles => setBannerImageFiles(acceptedFiles)}
                multiple={false}
                accept={"image/*"}
              >
                {({ getRootProps, getInputProps }) => (
                  <section className="container border-2 border-dashed p-8">
                    <div {...getRootProps({ className: "dropzone" })}>
                      <p>
                        Drag 'n' drop some files here, or click to select files
                      </p>

                      <Controller
                        defaultValue=""
                        control={control}
                        render={({ field }) => (
                          <Form.Input
                            {...getInputProps()}
                            // required={!bannerImageRights}
                            placeholder="Attribution Text"
                            error={errors?.bannerImageRights?.message}
                          />
                        )}
                      />
                    </div>
                    <aside>
                      <List bulleted>
                        {bannerImageFiles.map(file => {
                          return (
                            <List.Item key={file.path}>
                              {file.path} - {file.size} bytes
                            </List.Item>
                          )
                        })}
                      </List>
                    </aside>
                  </section>
                )}
              </Dropzone>
            </Form.Field>
            <Form.Field>
              <Checkbox
                checked={bannerImageRights}
                label="I have the rights to use this photo. If not you must provide attribution"
                onChange={(e, data) => {
                  setValue("banner_rights", data.checked)
                  setBannerImageRights(data.checked)
                }}
              />
            </Form.Field>
            {!bannerImageRights && (
              <>
                <Form.Field required={!bannerImageRights}>
                  <label>Attribution Text</label>
                  <Controller
                    name="banner_img_attribution_text"
                    defaultValue=""
                    control={control}
                    render={({ field }) => (
                      <Form.Input
                        {...field}
                        // required={!bannerImageRights}
                        placeholder="Attribution Text"
                        error={errors?.banner_img_attribution_text?.message}
                      />
                    )}
                  />
                </Form.Field>
                <Form.Field required={!bannerImageRights}>
                  <label>Attribution Link</label>
                  <Controller
                    name="banner_img_attribution_link"
                    defaultValue=""
                    control={control}
                    render={({ field }) => (
                      <Form.Input
                        {...field}
                        placeholder="Attribution Link"
                        error={errors?.banner_img_attribution_link?.message}
                      />
                    )}
                  />
                </Form.Field>
              </>
            )}
            <Form.Field>
              <Popup
                trigger={
                  <label>
                    Preview Image{" "}
                    <FontAwesomeIcon icon={faCircleInfo} className="pl-1" />
                  </label>
                }
              >
                <Popup.Header>Preview Image</Popup.Header>
                <Popup.Content>
                  <StaticImage
                    alt="Preview Image Preview"
                    src="../images/preview_image_tip.png"
                  ></StaticImage>
                </Popup.Content>
              </Popup>
              <Message icon>
                <Icon name="file image" />
                <Message.Content>
                  <Message.Header>Preview Image</Message.Header>
                  <Message.List>
                    <Message.Item>
                      This image will be used upcoming, previous &amp; event
                      finder
                    </Message.Item>
                    <Message.Item>
                      For best results provide and image 400 x 300
                    </Message.Item>
                  </Message.List>
                </Message.Content>
              </Message>
              <Dropzone
                onDrop={(acceptedFiles) => setPreviewImageFiles(acceptedFiles)}
                multiple={false}
                accept={"image/*"}
              >
                {({ getRootProps, getInputProps }) => (
                  <section className="container border-2 border-dashed p-8">
                    <div {...getRootProps({ className: "dropzone" })}>
                      <p>
                        Drag 'n' drop some files here, or click to select files
                      </p>
                      <Controller
                        defaultValue=""
                        control={control}
                        render={({ field }) => (
                          <Form.Input
                            {...getInputProps()}
                            // required={!bannerImageRights}
                            placeholder="Attribution Text"
                            error={errors?.previewImageFiles?.message}
                          />
                        )}
                      />
                    </div>
                    <aside>
                      <List bulleted>
                        {previewImageFiles.map(file => {
                          return (
                            <List.Item key={file.path}>
                              {file.path} - {file.size} bytes
                            </List.Item>
                          )
                        })}
                      </List>
                    </aside>
                  </section>
                )}
              </Dropzone>
            </Form.Field>
            <Form.Field>
              <Checkbox
                checked={previewImageRights}
                label="I have the rights to use this photo. If not you must provide attribution"
                onChange={(e, data) => {
                  setValue("preview_rights", data.checked)
                  setPreviewImageRights(data.checked)
                }}
              />
            </Form.Field>
            {!previewImageRights && (
              <>
                <Form.Field required={!previewImageRights}>
                  <label>Attribution Text</label>
                  <Controller
                    name="preview_img_attribution_text"
                    defaultValue=""
                    control={control}
                    render={({ field }) => (
                      <Form.Input
                        {...field}
                        // required={!previewImageRights}
                        placeholder="Attribution Text"
                        error={errors?.preview_img_attribution_text?.message}
                      />
                    )}
                  />
                </Form.Field>
                <Form.Field required={!previewImageRights}>
                  <label>Attribution Link</label>
                  <Controller
                    name="preview_img_attribution_link"
                    defaultValue=""
                    control={control}
                    render={({ field }) => (
                      <Form.Input
                        {...field}
                        // required={!previewImageRights}
                        placeholder="Attribution Link"
                        error={errors?.preview_img_attribution_link?.message}
                      />
                    )}
                  />
                </Form.Field>
              </>
            )}
          </Segment>

          <Segment className="!m-0">
            <Header as="h3">Location</Header>
            <Form.Field className={`event-type ${errors?.drop?.message && 'show'}`} >
              <label>Event Type</label>
              <Controller
                name="drop"
                control={control}
                rules={{ required: "Location is required" }}
                defaultValue=""
                render={({ field }) => (<Form.Dropdown
                  {...field}
                  options={eventTypeOptions}
                  selection
                  rules={{ required: true }}
                  placeholder="Event Type"
                  onChange={(e, data) => {
                    field.onChange(data.value)
                  }}
                />
                )}
              />
              <div class="ui pointing above prompt label" role="alert" aria-atomic="false">{errors?.drop?.message && <p>{errors?.drop?.message}</p>}</div>
            </Form.Field>
            <Form.Field>
              <Popup
                trigger={
                  <label>
                    Location Name{" "}
                    <FontAwesomeIcon icon={faCircleInfo} className="pl-1" />
                  </label>
                }
              >
                <Popup.Header>Location Name</Popup.Header>
                <Popup.Content>
                  This would be a descriptive name for the location. ie
                  Microsoft Office, Hilton Hotel, MGM Grand{" "}
                </Popup.Content>
              </Popup>
              <Controller
                name="location"
                defaultValue=""
                control={control}
                render={({ field }) => (
                  <Form.Input {...field} placeholder="Location Name" error={errors?.location?.message} />
                )}
              />
            </Form.Field>
            <Form.Field >
              <label>Address Line 1</label>
              <Controller
                name="address1"
                defaultValue=""
                control={control}
                render={({ field }) => (
                  <Form.Input
                    {...field}
                    placeholder="Address Line 1"
                    error={errors?.address1?.message}
                  />
                )}
              />
            </Form.Field>
            <Form.Field>
              <label>Address Line 2</label>
              <Controller
                name="address2"
                defaultValue=""
                control={control}
                render={({ field }) => (
                  <Input {...field} placeholder="Address Line 2" />
                )}
              />
            </Form.Field>
            <Form.Field >
              <label>City</label>
              <Controller
                name="city"
                defaultValue=""
                control={control}
                render={({ field }) => (
                  <Form.Input
                    {...field}
                    placeholder="City"
                    error={errors?.city?.message}
                  />
                )}
              />
            </Form.Field>
            <Form.Field >
              <label>State/Province</label>
              <Controller
                name="state_province"
                defaultValue=""
                control={control}
                render={({ field }) => (
                  <Form.Input
                    {...field}
                    placeholder="State/Province"
                    error={errors?.state_province?.message}
                  />
                )}
              />
            </Form.Field>
            <Form.Field >
              <label>Postal Code</label>
              <Controller
                name="postal_code"
                defaultValue=""
                control={control}
                render={({ field }) => (
                  <Form.Input
                    {...field}
                    placeholder="Postal Code"
                    error={errors?.postal_code?.message}
                  />
                )}
              />
            </Form.Field>
            <Form.Field className={`country ${errors?.country?.message && 'show'}`} >
              <label>Country</label>
              <Controller
                name="country"
                control={control}
                rules={{ required: "Country is required" }}
                defaultValue=""
                render={({ field }) => (<Form.Dropdown
                  {...field}
                  options={countryDetails.countryOptions}
                  selection
                  search
                  rules={{ required: true }}
                  placeholder="Country"
                  onChange={(e, data) => {
                    field.onChange(data.value)
                  }}
                />
                )}
              />
              <div class="ui pointing above prompt label" role="alert" aria-atomic="false">{errors?.country?.message && <p>{errors?.country?.message}</p>}</div>
            </Form.Field>
          </Segment>
          <Segment className="!m-0">
            <Header as="h3">Registration, Speakers &amp; Sponsors</Header>
            <Form.Field >
              <label>Registration Link</label>
              <Controller
                name="registration_url"
                defaultValue=""
                control={control}
                render={({ field }) => (
                  <Form.Input
                    {...field}
                    placeholder="Registration Link"
                    error={errors?.registration_url?.message}
                  />
                )}
              />
            </Form.Field>
            <Form.Field >
              <label>Registration Start Date / Time</label>
              <Controller
                name="registration_start_date"
                control={control}
                defaultValue=""
                render={({ field }) => (
                  <Flatpickr
                    {...field}
                    options={{
                      minDate: new Date(),
                      dateFormat: "F j, Y h:i K",
                      enableTime: true,
                      mode: "single",
                      wrap: true,
                    }}
                  >
                    <Form.Input type="text" iconPosition="left" error={errors?.registration_start_date?.message} >
                      <Icon name="calendar"></Icon>
                      <input data-input placeholder="Select Date" />
                    </Form.Input>
                  </Flatpickr>
                )}
              />
            </Form.Field>
            <Form.Field >
              <label>Registration End Date / Time</label>
              <Controller
                name="registration_end_date"
                control={control}
                defaultValue=""
                render={({ field }) => (
                  <Flatpickr
                    {...field}
                    options={{
                      minDate: new Date(registration_start_date?.toString()),
                      dateFormat: "F j, Y h:i K",
                      enableTime: true,
                      mode: "single",
                      wrap: true,
                    }}
                  >
                    <Form.Input type="text" iconPosition="left" error={errors?.registration_end_date?.message}>
                      <Icon name="calendar"></Icon>
                      <input data-input placeholder="Select Date" disabled={!registration_start_date} />
                    </Form.Input>
                  </Flatpickr>
                )}
              />
            </Form.Field>
            <Form.Field>
              <label>Sessionize Key</label>
              <Controller
                name="sessionize_key"
                defaultValue=""
                control={control}
                render={({ field }) => (
                  <Input {...field} placeholder="Sessionize Key" />
                )}
              />
            </Form.Field>
            <Form.Field>
              <label>Call for Speakers - Start Date / Time</label>
              <Controller
                name="speaker_call_start_date"
                control={control}
                defaultValue=""
                render={({ field }) => (
                  <Flatpickr
                    {...field}
                    options={{
                      minDate: new Date(),
                      dateFormat: "F j, Y h:i K",
                      enableTime: true,
                      mode: "single",
                      wrap: true,
                    }}
                  >
                    <Input type="text" iconPosition="left">
                      <Icon name="calendar"></Icon>
                      <input data-input placeholder="Select Date" />
                    </Input>
                  </Flatpickr>
                )}
              />
            </Form.Field>
            <Form.Field>
              <label>Call for Speakers - End Date / Time</label>
              <Controller
                name="speaker_call_end_date"
                control={control}
                render={({ field }) => (
                  <Flatpickr
                    {...field}
                    options={{
                      minDate: new Date(speaker_call_start_date?.toString()),
                      dateFormat: "F j, Y h:i K",
                      enableTime: true,
                      mode: "single",
                      wrap: true,
                    }}
                  >
                    <Input type="text" iconPosition="left">
                      <Icon name="calendar"></Icon>
                      <input data-input placeholder="Select Date" disabled={!speaker_call_start_date}/>
                    </Input>
                  </Flatpickr>
                )}
              />
            </Form.Field>
            <Form.Field>
              <label>Call for Sponsors - Start Date / Time</label>
              <Controller
                name="sponsor_call_start_date"
                control={control}
                defaultValue=""
                render={({ field }) => (
                  <Flatpickr
                    {...field}
                    options={{
                      minDate: new Date(),
                      dateFormat: "F j, Y h:i K",
                      enableTime: true,
                      mode: "single",
                      wrap: true,
                    }}
                  >
                    <Input type="text" iconPosition="left">
                      <Icon name="calendar"></Icon>
                      <input data-input placeholder="Select Date" />
                    </Input>
                  </Flatpickr>
                )}
              />
            </Form.Field>
            <Form.Field>
              <label>Call for Sponsors - End Date / Time</label>
              <Controller
                name="sponsor_call_end_date"
                control={control}
                render={({ field }) => (
                  <Flatpickr
                    {...field}
                    options={{
                      minDate: new Date(sponsor_call_start_date?.toString()),
                      dateFormat: "F j, Y h:i K",
                      enableTime: true,
                      mode: "single",
                      wrap: true,
                    }}
                  >
                    <Input type="text" iconPosition="left">
                      <Icon name="calendar"></Icon>
                      <input data-input placeholder="Select Date" disabled={!sponsor_call_start_date} />
                    </Input>
                  </Flatpickr>
                )}
              />
            </Form.Field>
            <Form.Field>
              <label>Sponsorship Prospectus</label>
              <Message icon>
                <Icon name="file alternate" />
                <Message.Content>
                  <Message.Header>Sponsor Details</Message.Header>
                  <Message.List>
                    <Message.Item>item 1</Message.Item>
                    <Message.Item>item 2</Message.Item>
                  </Message.List>
                </Message.Content>
              </Message>
              <Dropzone
                onDrop={acceptedFiles => setsponsorProspectus(acceptedFiles)}
                multiple={false}
              >
                {({ getRootProps, getInputProps }) => (
                  <section className="container border-2 border-dashed p-8">
                    <div {...getRootProps({ className: "dropzone" })}>
                      <Form.Input {...getInputProps()} error />
                      <p>
                        Drag 'n' drop some files here, or click to select files
                      </p>
                    </div>
                    <aside>
                      <List bulleted>
                        {sponsorProspectus.map(file => {
                          return (
                            <List.Item key={file.path}>
                              {file.path} - {file.size} bytes
                            </List.Item>
                          )
                        })}
                      </List>
                    </aside>
                  </section>
                )}
              </Dropzone>
            </Form.Field>
          </Segment>
        </div>
        <Button type="submit" className="!mt-6">
          Submit
        </Button>
      </Form>
    </StandardPageLayout>
  )
}

export default CreateEvent
